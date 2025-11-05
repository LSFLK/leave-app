// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// 
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.entity;
import leave_app_application_service.types;
import leave_app_application_service.utils;

import ballerina/http;
import ballerina/log;

configurable boolean isDebug = false;
configurable boolean emailNotificationsEnabled = false;
configurable string[] debugRecipients = ?;
configurable EmailAlertConfig emailAlertConfig = ?;
configurable string additionalCommentTemplate = "leaveAdditionalComment";
final string appName = isDebug ? "Leave App (Development)" : "Leave App";
const ALERT_HEADER = "Leave Submission/Cancellation";

# Send an email alert of given type with the given body to the given recipients.
# via the email service.
#
# + alertHeader - Descriptive header of the alert  
# + subject - Email subject  
# + body - Email body  
# + recipients - Email recipients  
# + templateId - Email template ID
# + return - Error if sending the email fails
isolated function processEmailNotification(string alertHeader, string subject, map<string> body, 
    string[] recipients, string templateId = emailAlertConfig.templateId) returns error? {
    if !emailNotificationsEnabled {
        log:printInfo("Email notifications are disabled. Skipping the email alert.");
        return;
    }

    string[] to = isDebug ? debugRecipients : getValidEmailRecipientsFromList(recipients);
    json payload = {
        appUuid: emailAlertConfig.uuid,
        templateId: templateId,
        frm: emailAlertConfig.'from,
        to,
        subject,
        contentKeyValPairs: body
    };

    // Retries email sending 3 times.
    // Logs error if all retries fail.
    retry transaction {
        json|error alertResult = emailClient->/send\-smtp\-email.post(payload);
        if alertResult is error {
            string errBody = alertResult is http:ApplicationResponseError ? alertResult.detail().body.toString() : alertResult.message();
            fail error error:Retriable(string `Failed to send ${alertHeader} alert to ${
                string:'join(", ", ...to)}: ${errBody}`);
        }

        check commit;
    } on fail error err {
        log:printError(err.message());
        return err;
    }

    log:printInfo(string `Successfully sent the email notification to ${string:'join(", ", ...to)}.`);
}

# Send an email alert to the given recipients when a leave is submitted or cancelled.
#
# + details - EmailNotificationDetails record 
# + emailRecipients - Email recipients
# + return - Error if sending the email fails
public isolated function sendLeaveNotification(EmailNotificationDetails details, string[] emailRecipients) returns error? {
    map<string> body = {
        APP_NAME: appName,
        ALERT_TYPE: ALERT_HEADER,
        CONTENT: details.body
    };

    check processEmailNotification(ALERT_HEADER, details.subject, body, emailRecipients);
}

# Send an email alert to the given recipients when an additional comment is added to a leave.
#
# + details - EmailNotificationDetails record 
# + emailRecipients - Email recipients
# + return - Error if sending the email fails
public isolated function sendAdditionalComment(EmailNotificationDetails details, string[] emailRecipients) returns error? {
    map<string> body = {
        APP_NAME: appName,
        ALERT_TYPE: ALERT_HEADER,
        CONTENT: details.body
    };

    check processEmailNotification(ALERT_HEADER, details.subject, body, emailRecipients, additionalCommentTemplate);
}

# Generate the email content for a leave.
#
# + employeeEmail - Employee email
# + leave - Leave entity
# + isCancel - Whether the leave is cancelled
# + isPastLeave - Whether the leave is in the past
# + emailSubject - Email subject
# + return - EmailNotificationDetails record
public isolated function generateContentForLeave(string employeeEmail, entity:LeaveEntity|types:LeavePayload leave,
        boolean isCancel = false, boolean isPastLeave = false, string? emailSubject = ())
    returns readonly & EmailNotificationDetails {
    EmailNotificationDetails notificationDetails;
    string startDateString = utils:getEmailDateStringFromTimestamp(leave.startDate);
    string? firstName = ();
    string? lastName = ();
    entity:EmployeeEntity|error employee = entity:getEmployee(employeeEmail);
    if employee is entity:EmployeeEntity {
        firstName = employee.firstName;
        lastName = employee.lastName;
    }

    string employeeName = firstName is string ? string `${firstName} ${lastName ?: ""}` : employeeEmail;
    match leave.periodType {
        types:ONE_DAY_LEAVE => {
            notificationDetails = generateContentForOneDayLeave(employeeName, isCancel, leave.leaveType, startDateString, isPastLeave, emailSubject);
        }
        types:HALF_DAY_LEAVE => {
            boolean? isMorningLeave = leave.isMorningLeave;
            if isMorningLeave is () {
                log:printError(string `Leave in invalid state at generateContentForLeave. isMorningLeave is not set for the Leave.`);
                panic error(string `isMorningLeave is not set for the leave`);
            }
            notificationDetails = generateContentForHalfDayLeave(employeeName, isCancel, leave.leaveType, startDateString, leave.isMorningLeave ?: false, isPastLeave, emailSubject);
        }
        _ => {
            string endDateString = utils:getEmailDateStringFromTimestamp(leave.endDate);
            notificationDetails = generateContentForMultipleDaysLeave(employeeName, isCancel, leave.leaveType, startDateString, endDateString, isPastLeave, emailSubject);
        }
    }

    return notificationDetails.cloneReadOnly();
}

# Generate the email content for a half day leave.
# 
# + employeeName - Employee name
# + isCancel - Whether the leave is cancelled
# + leaveType - Leave type
# + date - Leave date
# + isMorningHalf - Whether the leave is for the morning half
# + isPastLeave - Whether the leave is in the past
# + emailSubject - Email subject
# + return - EmailNotificationDetails record
isolated function generateContentForHalfDayLeave(string employeeName, boolean isCancel, string leaveType, string date, boolean isMorningHalf, boolean isPastLeave, string? emailSubject = ())
    returns EmailNotificationDetails {
    string subject = emailSubject ?: getPrefixedEmailSubject(string `${employeeName} ${isPastLeave ? "was" : "is"} on half-day ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave (${isMorningHalf ? "first" : "second"} half) on ${date}`);
    string body = !isCancel ?
        (string `
            <p>
                Hi all,
                <br />
                Please note that ${employeeName} ${isPastLeave ? "was" : "will be"} on half-day ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave (${isMorningHalf ? "first" : "second"} half) on ${date}.
            <p>
        `)
        :
        (string `
            <p>
                Hi all,
                <br />
                Please note that ${employeeName} has cancelled the half-day ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave applied for ${date}.
            <p>
        `);
    return {
        subject,
        body
    };
};

# Generate the email content for a one day leave.
# 
# + employeeName - Employee name
# + isCancel - Whether the leave is cancelled
# + leaveType - Leave type
# + date - Leave date
# + isPastLeave - Whether the leave is in the past
# + emailSubject - Email subject
# + return - EmailNotificationDetails record
isolated function generateContentForOneDayLeave(string employeeName, boolean isCancel, string leaveType, string date, boolean isPastLeave, string? emailSubject = ())
    returns EmailNotificationDetails {
    string subject = emailSubject ?: getPrefixedEmailSubject(string `${employeeName} ${isPastLeave ? "was" : "will be"} on ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave on ${date}`);
    string body = !isCancel ?
        (string `
            <p>
                Hi all,
                <br />
                Please note that ${employeeName} ${isPastLeave ? "was" : "will be"} on ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave on ${date}.
            <p>
        `)
        :
        (string `
            <p>
                Hi all,
                <br />
                Please note that ${employeeName} has cancelled the ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave applied for ${date}.
            <p>
        `);
    return {
        subject,
        body
    };
};

# Generate the email content for a multiple days leave.
# 
# + employeeName - Employee name
# + isCancel - Whether the leave is cancelled
# + leaveType - Leave type
# + fromDate - Leave start date
# + toDate - Leave end date
# + isPastLeave - Whether the leave is in the past
# + emailSubject - Email subject
# + return - EmailNotificationDetails record
isolated function generateContentForMultipleDaysLeave(string employeeName, boolean isCancel, string leaveType, string fromDate, string toDate, boolean isPastLeave, string? emailSubject = ())
    returns EmailNotificationDetails {
    string subject = emailSubject ?: getPrefixedEmailSubject(string `${employeeName} ${isPastLeave ? "was" : "will be"} on ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave from ${fromDate} to ${toDate}`);
    string body = !isCancel ?
        (string `
            <p>
                Hi all,
                <br />
                Please note that ${employeeName} ${isPastLeave ? "was" : "will be"} on ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave from ${fromDate} to ${toDate}.
            <p>
        `)
        :
        (string `
            <p>
                Hi all,
                <br />
                Please note that ${employeeName} has cancelled the ${leaveType is types:LIEU_LEAVE ? string `${types:LIEU_LEAVE} ` : ""}leave applied from ${fromDate} to ${toDate}.
            <p>
        `);
    return {
        subject,
        body
    };
}

# Generate the email content for an additional comment.
# 
# + subject - Email subject
# + additionalComment - Additional comment
# + return - EmailNotificationDetails record
public isolated function generateContentForAdditionalComment(string subject, string additionalComment) returns EmailNotificationDetails {
    string body = string `
            <p>
                Additional Comment: ${additionalComment}
            <p>
        `;
    return {
        subject,
        body
    };
}
