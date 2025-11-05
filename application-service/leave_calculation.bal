// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.calendar_events;
import leave_app_application_service.entity;
import leave_app_application_service.types;
import leave_app_application_service.utils;

import ballerina/http;
import ballerina/log;
import ballerina/time;
import ballerina/uuid;

configurable decimal allowedDaysToCancelLeave = 30;

# Date range validation function.
#
# + startDate - Start date of the range
# + endDate - End date of the range
# + return - Returns UTC start and end dates or error for validation failure
isolated function validateDateRange(string startDate, string endDate) returns [time:Utc, time:Utc]|error {
    do {
        time:Utc startUtc = check utils:getUtcDateFromString(startDate);
        time:Utc endUtc = check utils:getUtcDateFromString(endDate);

        if startUtc > endUtc {
            return error(types:ERR_MSG_END_DATE_BEFORE_START_DATE);
        }

        return [startUtc, endUtc];
    } on fail error err {
        string errorMessage = err.message();
        if err is types:ValidationError {
            errorMessage = err.detail().externalMessage;
        }

        return error(errorMessage, code = http:StatusBadRequest);
    }

}

# Creates a event for an employee's leave in their calendar
#
# + email - Employee email 
# + leave - Created leave
# + calendarEventId - UUID to be used for event
isolated function createLeaveEventInCalendar(string email, entity:LeaveEntity leave, string calendarEventId) {
    final entity:LeaveEntity {id, periodType, isMorningLeave, startDate, endDate, location} = leave;
    string startDateString = utils:getDateStringFromTimestamp(startDate);
    string endDateString = utils:getDateStringFromTimestamp(endDate);

    string timzeZoneOffset = "+00:00";
    if location is string && types:timezoneOffsetMap.hasKey(location) {
        timzeZoneOffset = types:timezoneOffsetMap.get(location);
    }

    calendar_events:Time startTime = {
        dateTime: string `${startDateString}T00:00:00.000`,
        timeZone: string `GMT${timzeZoneOffset}`
    };
    calendar_events:Time endTime = {
        dateTime: string `${endDateString}T23:59:00.000`,
        timeZone: string `GMT${timzeZoneOffset}`
    };

    if periodType is types:HALF_DAY_LEAVE && isMorningLeave == false {
        startTime.dateTime = string `${startDateString}T13:00:00.000`;
    } else if periodType is types:HALF_DAY_LEAVE && isMorningLeave == true {
        endTime.dateTime = string `${startDateString}T13:00:00.000`;
    }

    log:printInfo(string `Creating event for leave id: ${id} email: ${email}.`);
    string|error? eventId = calendar_events:createEvent(email, {
        summary: "On Leave",
        description: "On Leave",
        colorId: "4",
        'start: startTime,
        end: endTime,
        id: calendarEventId
    });

    if eventId is string {
        log:printInfo(string `Event created successfully with event id: ${eventId}. Leave id: ${id}.`);
    } else if eventId is error {
        log:printError(string `Error occurred while creating event for leave id: ${id} with ID: ${calendarEventId}.`, 'error = eventId, stackTrace = eventId.stackTrace());
    } else {
        log:printError(string `Error occurred while creating event for leave id: ${id} with ID: ${calendarEventId}. No ID returned.`);
    }
}

# Delete an event from an employee's calendar
#
# + email - Employee email  
# + eventId - Calendar event ID
# + return - Nil or error
isolated function deleteLeaveEventFromCalendar(string email, string eventId) returns error? {
    log:printInfo(string `Deleting with event ID: ${eventId} email: ${email}.`);
    error? err = calendar_events:deleteEvent(email, eventId);

    if err is error {
        log:printError(string `Error occurred while deleting event with event ID: ${eventId}.`);
        return err;
    }

    log:printInfo(string `Event deleted successfully with event ID: ${eventId}.`);
}

# Generates a UUID to be used for the calendar event creation
#
# + return - UUID for calendar event
isolated function createUuidForCalendarEvent() returns string {
    string uuid = uuid:createType4AsString();
    string calendarId = re `-`.replaceAll(uuid, "");
    return calendarId.toLowerAscii();
}

# Checks if a leave is allowed to be cancelled
#
# + leave - Leave to be checked
# + return - Whether the leave is allowed to be cancelled or error
isolated function checkIfLeavedAllowedToCancel(entity:LeaveEntity leave) returns boolean {
    final entity:LeaveEntity {startDate} = leave;
    time:Utc|error startUtc = utils:getUtcDateFromString(utils:getDateStringFromTimestamp(startDate));
    if startUtc is error {
        log:printError(string `Error occurred while getting UTC date from start date: ${startDate}.`, 'error = startUtc, stackTrace = startUtc.stackTrace());
        return false;
    }

    time:Utc currentUtc = time:utcNow();

    decimal diff = time:utcDiffSeconds(currentUtc, startUtc) / types:DAY_IN_SECONDS;
    return diff <= allowedDaysToCancelLeave;
}

# Get leave report content for a given leaves.
#
# + leaves - Leaves to be used to generate report content
# + return - Report content
isolated function getLeaveReportContent(entity:LeaveEntity[] leaves) returns types:ReportContent {
    types:ReportContent reportContent = {};
    foreach entity:LeaveEntity leave in leaves {
        string leaveType = leave.leaveType;
        if leaveType == types:TOTAL_LEAVE_TYPE {
            // This type is not supported and should not exist.
            break;
        }

        // Handling sick leave as casual leave.
        if leaveType is types:SICK_LEAVE {
            leaveType = types:CASUAL_LEAVE;
        }

        map<float>? employeeLeaveMap = reportContent[leave.email];
        if employeeLeaveMap is map<float> {
            float? leaveTypeCount = employeeLeaveMap[leaveType];
            if leaveTypeCount is float {
                employeeLeaveMap[leaveType] = leaveTypeCount + leave.numberOfDays;
            } else {
                employeeLeaveMap[leaveType] = leave.numberOfDays;
            }

            employeeLeaveMap[types:TOTAL_LEAVE_TYPE] = leave.numberOfDays + employeeLeaveMap.get(types:TOTAL_LEAVE_TYPE);
            if leaveType !is types:LIEU_LEAVE {
                employeeLeaveMap[types:TOTAL_EXCLUDING_LIEU_LEAVE_TYPE] = leave.numberOfDays +
                    employeeLeaveMap.get(types:TOTAL_EXCLUDING_LIEU_LEAVE_TYPE);
            }
        } else {
            reportContent[leave.email] = {
                [leaveType] : leave.numberOfDays,
                [types:TOTAL_LEAVE_TYPE] : leave.numberOfDays,
                [types:TOTAL_EXCLUDING_LIEU_LEAVE_TYPE] : leaveType is types:LIEU_LEAVE ? 0 : leave.numberOfDays
            };
        }
    }

    return reportContent;
}

# Get legally entitled leave for an employee based on location.
#
# + employee - Employee record
# + return - Locaton based leave policy or error
isolated function getLegallyEntitledLeave(entity:EmployeeEntity employee) returns types:LeavePolicy|error {
    match employee.location {
        types:LK => {
            string? employmentStartDate = employee.startDate;
            string? employmentEndDate = employee.finalDayOfEmployment;
            if employmentStartDate is () || employmentStartDate.length() == 0 {
                return error("Employee start date is not set.");
            }
            time:Civil civilEndDate = employmentEndDate is string ?
                check utils:getCivilDateFromString(employmentStartDate) : time:utcToCivil(time:utcNow());
            time:Civil civilEmploymentStartDate = check utils:getCivilDateFromString(employmentStartDate);

            int yearsOfEmployment = civilEndDate.year - civilEmploymentStartDate.year;
            float lkAnnualLeave = 14.0;
            float lkCasualLeave = 7.0;

            if yearsOfEmployment == 0 { // First year of employment
                // No Annual leave entitlement
                lkAnnualLeave = 0.0;
                // One day of Casual leave for every two months of employment. This value will change throughout the year
                int monthsOfEmployment = civilEndDate.month - civilEmploymentStartDate.month;
                lkCasualLeave = <float>(monthsOfEmployment / 2);
            } else if yearsOfEmployment == 1 { // Second year of employment
                if civilEmploymentStartDate.month >= 10 { // If employment start date is on or after October
                    lkAnnualLeave = 4.0;
                } else if civilEmploymentStartDate.month >= 7 { // If employment start date is on or after July and before October
                    lkAnnualLeave = 7.0;
                } else if civilEmploymentStartDate.month >= 4 { // If employment start date is on or after April and before July
                    lkAnnualLeave = 10.0;
                }
                // If employment start date is on or after January and before April
            }

            return {
                annual: lkAnnualLeave,
                casual: lkCasualLeave
            };
        }
        _ => {
            return {};
        }
    }
}

# Fetch employee leaves and holidays for a given date range to generate user calendar information.
#
# + email - Employee email 
# + startDate - Start date of the range 
# + endDate - End date of the range
# + return - User calendar information or error
isolated function getUserCalendarInformation(string email, string startDate, string endDate)
    returns types:UserCalendarInformation|error {

    entity:EmployeeEntity|error employeeEntityResponse = entity:getEmployee(email);
    if employeeEntityResponse is error {
        log:printError(types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED, employeeEntityResponse);
        return error(types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED);
    }

    final readonly & entity:EmployeeEntity employee = employeeEntityResponse.cloneReadOnly();

    worker LeavesWorker returns types:Leave[]|error {
        string[] emails = [email];
        entity:LeaveEntity[]|error leaves = entity:getLeaves({
            emails,
            isActive: true,
            startDate,
            endDate,
            orderBy: entity:DESC
        });

        if leaves is error {
            log:printError(types:ERR_MSG_LEAVES_RETRIEVAL_FAILED, leaves);
            return error(types:ERR_MSG_LEAVES_RETRIEVAL_FAILED);
        }

        return from entity:LeaveEntity leave in leaves
            select {
                id: leave.id,
                startDate: leave.startDate,
                endDate: leave.endDate,
                leaveType: leave.leaveType,
                isMorningLeave: leave.isMorningLeave,
                numberOfDays: leave.numberOfDays,
                isActive: leave.isActive,
                periodType: leave.periodType,
                email: leave.email,
                isCancelAllowed: checkIfLeavedAllowedToCancel(leave),
                createdDate: leave.createdDate

            };
    }

    worker HolidaysWorker returns types:Holiday[]|error {
        string? country = employee.location;
        if country is () {
            return error(types:ERR_MSG_EMPLOYEE_LOCATION_RETRIEVAL_FAILED);
        }

        entity:HolidayEntity[]|error holidays = entity:getHolidays(country, startDate, endDate);
        if holidays is error {
            log:printError(types:ERR_MSG_HOLIDAYS_RETRIEVAL_FAILED, holidays);
            return error(types:ERR_MSG_HOLIDAYS_RETRIEVAL_FAILED);
        }

        return from entity:HolidayEntity holiday in holidays
            select {
                date: holiday.date,
                title: holiday.title
            };
    }

    types:Leave[] leaves = check wait LeavesWorker;
    types:Holiday[] holidays = check wait HolidaysWorker;
    return {
        leaves,
        holidays
    };
}

# Validate Leave payload.
#
# + payload - Leave payload
# + return - Return validated leave payload
isolated function validateLeaveInputPayload(types:LeavePayload payload) returns types:LeavePayload|error {
    types:LeavePayload modifiedPayload = payload;
    if payload.isMorningLeave is boolean {
        if payload.startDate != payload.endDate {
            return error("Morning leave can only be applied for a single day");
        }

        if payload.periodType !is types:HALF_DAY_LEAVE {
            log:printWarn(string `Period type is not set to HALF_DAY_LEAVE, it is set as ${payload.periodType}. 
                Setting it to HALF_DAY_LEAVE`);
            modifiedPayload.periodType = types:HALF_DAY_LEAVE;
        }
    }

    return modifiedPayload;
}


# Get leave entitlement for an employee.
#
# + employee - Employee record 
# + years - Years to get leave entitlement for
# + return - Leave entitlements or error
isolated function getLeaveEntitlement(entity:EmployeeEntity employee, int[] years) returns types:LeaveEntitlement[]|error {
    types:LeavePolicy leavePolicy = check getLegallyEntitledLeave(employee);
    int[] yearsOfLeave = years.length() == 0 ? [utils:getCurrentYear()] : years;
    return from int year in yearsOfLeave
        let types:LeavePolicy policyAdjustedLeave = check getPolicyAdjustedLeaveCounts(employee, year)
        select {
            year,
            location: employee.location,
            leavePolicy,
            policyAdjustedLeave
        };
}

# Get policy adjusted leave counts for an employee.
#
# + employee - Employee record 
# + year - Year to get leave counts for
# + return - Policy adjusted leave counts or error
isolated function getPolicyAdjustedLeaveCounts(entity:EmployeeEntity employee, int? year = ()) returns types:LeavePolicy|error {
    types:LeavePolicy leavePolicy = check getLegallyEntitledLeave(employee);
    float? entitledCasualLeave = leavePolicy?.casual;
    float? entitledAnnualLeave = leavePolicy?.annual;
    string? email = employee.workEmail;
    if entitledCasualLeave !is float || entitledAnnualLeave !is float {
        return {};
    }

    if email is () {
        return error("Employee work email is not set.");
    }

    string startDate = utils:getStartDateOfYear(year = year);
    string endDate = utils:getEndDateOfYear(year = year);
    entity:LeaveEntity[] entityLeaves = check entity:getLeaves({emails: [email], isActive: true, startDate, endDate});

    float totalAnnualAndCasualLeaveTaken = 0.0;
    foreach entity:LeaveEntity entityLeave in entityLeaves {
        if entityLeave.leaveType is types:CASUAL_LEAVE || entityLeave.leaveType is types:ANNUAL_LEAVE {
            totalAnnualAndCasualLeaveTaken += entityLeave.numberOfDays;
        }
    }

    float adjustedCasualLeave = 0.0;
    float adjustedAnnualLeave = 0.0;

    float totalLeavesAfterCasualLeaveEntitlement = totalAnnualAndCasualLeaveTaken - entitledCasualLeave;
    if totalLeavesAfterCasualLeaveEntitlement > 0.0 { // If casual leave entitlement is exceeded
        adjustedCasualLeave = entitledCasualLeave;
        float totalLeavesAfterAnnualLeaveEntitlement = totalLeavesAfterCasualLeaveEntitlement - entitledAnnualLeave;
        if totalLeavesAfterAnnualLeaveEntitlement > 0.0 { // If annual leave entitlement is exceeded
            adjustedAnnualLeave += entitledAnnualLeave;
            adjustedCasualLeave += totalLeavesAfterAnnualLeaveEntitlement;
        } else { // If annual leave entitlement is not exceeded
            adjustedAnnualLeave += totalLeavesAfterAnnualLeaveEntitlement;
        }
    } else { // If casual leave entitlement is not exceeded
        adjustedCasualLeave = totalAnnualAndCasualLeaveTaken;
    }

    return {
        casual: adjustedCasualLeave,
        annual: adjustedAnnualLeave
    };
}
