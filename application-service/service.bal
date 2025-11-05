// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.email;
import leave_app_application_service.entity;
import leave_app_application_service.security;
import leave_app_application_service.types;
import leave_app_application_service.utils;

import ballerina/http;
import ballerina/time;
import ballerina/log;

service http:InterceptableService / on new http:Listener(9090) {
    public function createInterceptors() returns RequestInterceptor {
        return new RequestInterceptor();
    }

    function init() returns error? {
        log:printInfo("Leave Application API started.");
        // To cache employees and as an additional health check
        _ = check entity:getEmployees();
    }

    # Get Application specific data required for initializing the leave form.
    #
    # + ctx - Request context
    # + return - Return application specific form data
    resource function get form\-data(http:RequestContext ctx) returns types:FormDataResponse|types:InternalServerError {
        security:AsgardeoJwt|error decodedJwt = ctx.get(types:JWT_CONTEXT_KEY).ensureType();
        if decodedJwt is error {
            log:printError(types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED, decodedJwt);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED
                }
            };
        }
        string email = decodedJwt.email;
        entity:EmployeeEntity|error employee = entity:getEmployee(email);
        if employee is error {
            log:printError(types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED, employee);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED
                }
            };
        }

        string[] emails = [email];
        string startDate = utils:getStartDateOfYear();
        string endDate = utils:getEndDateOfYear();

        entity:LeaveEntity[]|error leaves = entity:getLeaves({emails, startDate, endDate, orderBy: entity:DESC});
        if leaves is error {
            log:printError(types:ERR_MSG_LEAVES_RETRIEVAL_FAILED, leaves);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_LEAVES_RETRIEVAL_FAILED
                }
            };
        }
        entity:EmployeeEntity {managerEmail, location} = employee;
        string[] emailRecipients = leaves.length() > 0 ? leaves[0].emailRecipients : [];
        string[] leadEmails = managerEmail == () ? [] : [managerEmail];

        types:LeavePolicy|error legallyEntitledLeave = getLegallyEntitledLeave(employee);
        if legallyEntitledLeave is error {
            log:printError(types:ERR_MSG_LEGALLY_ENTITLED_LEAVE_RETRIEVAL_FAILED, legallyEntitledLeave);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_LEGALLY_ENTITLED_LEAVE_RETRIEVAL_FAILED
                }
            };
        }

        return <types:FormDataResponse>{
            body: {
                emailRecipients,
                leadEmails,
                location,
                legallyEntitledLeave,
                leaveReportContent: getLeaveReportContent(leaves)
            }
        };
    }

    # Get leaves for the given filter.
    #
    # + ctx - Request context 
    # + email - Email of the user to filter the leaves
    # + return - Return list of leaves
    resource function get leaves(http:RequestContext ctx, string? email = (), string? startDate = (), string? endDate = (), boolean? isActive = ())
        returns types:FetchLeavesResponse|types:Forbidden|types:InternalServerError {
        security:AsgardeoJwt|error decodedJwt = ctx.get(types:JWT_CONTEXT_KEY).ensureType();
        if decodedJwt is error {
            log:printError(types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED, decodedJwt);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED
                }
            };
        }

        if email != decodedJwt.email {
            boolean validateForSingleRole = security:validateForSingleRole(decodedJwt, adminRoles);
            if !validateForSingleRole {
                security:logUnauthorizedUserAccess(decodedJwt.email, string `/leaves with email=${email.toString()}`);
                return <types:Forbidden>{
                    body: {
                        message: types:ERR_MSG_UNAUTHORIZED_VIEW_LEAVE
                    }
                };
            }
        }

        string[]? emails = (email is string) ? [email] : ();
        entity:LeaveEntity[]|error entityLeaves = entity:getLeaves({emails, isActive, startDate, endDate});
        if entityLeaves is error {
            log:printError(types:ERR_MSG_LEAVES_RETRIEVAL_FAILED, entityLeaves);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_LEAVES_RETRIEVAL_FAILED
                }
            };
        }

        types:Leave[] leaves = [];
        map<float> statsMap = {};
        float totalCount = 0.0;
        foreach entity:LeaveEntity entityLeave in entityLeaves {
            var {
                id,
                createdDate,
                leaveType,
                endDate: entityEndDate,
                isActive: entityIsActive,
                periodType,
                startDate: entityStartDate,
                email: entityEmail,
                isMorningLeave,
                numberOfDays
            } = entityLeave;

            leaves.push({
                id,
                createdDate,
                leaveType,
                endDate: entityEndDate,
                isActive: entityIsActive,
                periodType,
                startDate: entityStartDate,
                email: entityEmail,
                isMorningLeave,
                numberOfDays,
                isCancelAllowed: checkIfLeavedAllowedToCancel(entityLeave)
            });

            statsMap[leaveType] = statsMap.hasKey(leaveType) ?
                statsMap.get(leaveType) + numberOfDays : numberOfDays;

            if leaveType !is types:UncountedLeaves {
                totalCount += numberOfDays;
            }
        }

        statsMap["total"] = totalCount;
        return <types:FetchLeavesResponse>{
            body: {
                leaves,
                stats: from [string, float] ['type, count] in statsMap.entries()
                    select {
                        'type,
                        count
                    }
            }
        };
    }

    # Create a new leave.
    #
    # + ctx - Request context  
    # + payload - Request payload
    # + return - Success response if the leave is created successfully, otherwise an error response
    resource function post leaves(http:RequestContext ctx, @http:Payload types:LeavePayload payload, boolean isValidationOnlyMode = false)
        returns types:Success|types:CalculatedLeaveResponse|types:BadRequest|types:InternalServerError {
        security:AsgardeoJwt|error decodedJwt = ctx.get(types:JWT_CONTEXT_KEY).ensureType();
        if decodedJwt is error {
            log:printError("Error occurred while retrieving JWT from request context", decodedJwt);
            return <types:InternalServerError>{
                body: {
                    message: decodedJwt.message()
                }
            };
        }

        string email = decodedJwt.email;
        log:printInfo(string `Leave${isValidationOnlyMode ? " validation " : " "}request received from email: ${
            decodedJwt.email} with payload: ${payload.toString()}`);

        [time:Utc, time:Utc]|error validatedDateRange = utils:validateDateRange(payload.startDate, payload.endDate);
        if validatedDateRange is error {
            log:printError(types:ERR_MSG_INVALID_DATE_FORMAT, validatedDateRange);
            return <types:BadRequest>{
                body: {
                    message: types:ERR_MSG_INVALID_DATE_FORMAT
                }
            };
        }
        types:Day[] weekdaysFromRange = utils:getWeekdaysFromRange(validatedDateRange[0], validatedDateRange[1]);

        if isValidationOnlyMode {
            entity:LeaveEntity|error validateLeave = entity:validateLeave(payload, email);
            if validateLeave is error {
                if validateLeave is types:ValidationError {
                    string externalMessage = validateLeave.detail().externalMessage;
                    return <types:CalculatedLeaveResponse>{
                        body: {
                            workingDays: externalMessage == types:ERR_MSG_LEAVE_SHOULD_BE_AT_LEAST_ONE_WORKING_DAY ?
                                0 : (payload.periodType is types:HALF_DAY_LEAVE && weekdaysFromRange.length() > 0 ?
                                    0.5 : <float>weekdaysFromRange.length()),
                            hasOverlap: externalMessage == types:ERR_MSG_LEAVE_OVERLAPS_WITH_EXISTING_LEAVE,
                            message: externalMessage
                        }
                    };
                }

                return <types:InternalServerError>{
                    body: {
                        message: "Error while validating leave."
                    }
                };
            }

            return <types:CalculatedLeaveResponse>{
                body: {
                    workingDays: payload.periodType is types:HALF_DAY_LEAVE ? 0.5 : <float>validateLeave.effectiveDays.length(),
                    hasOverlap: false,
                    message: "Valid leave request"
                }
            };
        }

        final email:EmailNotificationDetails emailContentForLeave = email:generateContentForLeave(email, payload);
        final string calendarEventId = createUuidForCalendarEvent();
        final string[] allRecipientsForUser = getAllEmailRecipientsForUser(email, payload.emailRecipients);
        final string? comment = payload.comment;

        payload.emailSubject = emailContentForLeave.subject;
        payload.calendarEventId = calendarEventId;
        final entity:LeaveEntity|error leave = entity:createLeave({...payload}, email);
        if leave is error {
            log:printError(string `Failed to submit leave. Payload: ${payload.toJsonString()}`);
            return <types:InternalServerError>{
                body: {
                    message: "Error while submitting leave."
                }
            };
        }
        log:printInfo(string `Submitted leave successfully. ID: ${leave.id}.`);

        future<error?> notificationFuture = start email:sendLeaveNotification(
            emailContentForLeave.cloneReadOnly(), allRecipientsForUser.cloneReadOnly());
        _ = start createLeaveEventInCalendar(email, leave, calendarEventId);
        if comment is string && !utils:checkIfEmptyString(comment) {
            string[] commentRecipients = allRecipientsForUser;
            if !payload.isPublicComment {
                commentRecipients = getPrivateRecipientsForUser(email, payload.emailRecipients);
            }

            error? notificationResult = wait notificationFuture;
            if notificationResult is () {
                // Does not send the additional comment notification if the main notification has failed.
                email:EmailNotificationDetails contentForAdditionalComment = email:generateContentForAdditionalComment(
                    emailContentForLeave.subject, comment);
                _ = start email:sendAdditionalComment(contentForAdditionalComment, commentRecipients);
            }
        }

        return <types:Success>{
            body: {
                message: "Leave submitted successfully."
            }
        };
    }

    # Cancel a leave.
    #
    # + leaveId - Leave ID 
    # + ctx - Request context
    # + return - Return cancelled leave on success, otherwise an error response
    resource function delete leaves/[int leaveId](http:RequestContext ctx)
        returns types:Success|types:Forbidden|types:BadRequest|types:InternalServerError {
        security:AsgardeoJwt|error decodedJwt = ctx.get(types:JWT_CONTEXT_KEY).ensureType();
        if decodedJwt is error {
            log:printError("Error occurred while retrieving JWT from request context", decodedJwt);
            return <types:InternalServerError>{
                body: {
                    message: decodedJwt.message()
                }
            };
        }

        entity:LeaveEntity|error? leave = entity:getLeave(leaveId);
        if leave is error {
            log:printError("Error occurred while retrieving leave", leave);
            return <types:InternalServerError>{
                body: {
                    message: leave.message()
                }
            };
        }

        if leave is () {
            return <types:BadRequest>{
                body: {
                    message: "Invalid leave ID."
                }
            };
        }

        final string email = decodedJwt.email;
        if leave.email != email {
            boolean validateForSingleRole = security:validateForSingleRole(decodedJwt, adminRoles);
            if !validateForSingleRole {
                return <types:Forbidden>{
                    body: {
                        message: "You are not authorized to cancel this leave."
                    }
                };
            }
        }

        if !leave.isActive {
            return <types:BadRequest>{
                body: {
                    message: "Leave is already cancelled."
                }
            };
        }

        entity:LeaveEntity|error cancelLeave = entity:cancelLeave(leaveId);
        if cancelLeave is error {
            log:printError("Error occurred while cancelling leave", cancelLeave);
            return <types:InternalServerError>{
                body: {
                    message: cancelLeave.message()
                }
            };
        }

        email:EmailNotificationDetails generateContentForLeave = email:generateContentForLeave(
            email, leave, isCancel = true, emailSubject = cancelLeave.emailSubject);
        string[] allRecipientsForUser = getAllEmailRecipientsForUser(email, cancelLeave.emailRecipients);
        _ = start email:sendLeaveNotification(generateContentForLeave, allRecipientsForUser);

        if cancelLeave.calendarEventId is () {
            log:printError(string `Calendar event ID is not available for leave with ID: ${leaveId}.`);
        } else {
            _ = start deleteLeaveEventFromCalendar(email, <string>cancelLeave.calendarEventId);
        }

        return <types:Success>{
            body: {
                message: "Leave cancelled successfully"
            }
        };
    }

    # Fetch leave report.
    #
    # + ctx - Request context 
    # + payload - Request payload
    # + return - Return leave report on success, otherwise an error response
    resource function post generate\-report(http:RequestContext ctx, @http:Payload types:ReportPayload payload)
        returns types:ReportGenerationResponse|types:InternalServerError {
        var {location, businessUnit, department, team, employeeStatuses, startDate, endDate} = payload;
        entity:EmployeeEntity[]|error employees = entity:getEmployeesFromEntity(location, businessUnit, department, team, employeeStatuses);
        if employees is error {
            log:printError(types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED, employees);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED
                }
            };
        }

        // Work email should not be null.
        string[] emails = from entity:EmployeeEntity employee in employees
            let string? email = employee.workEmail
            where email is string
            select email;
        if emails.length() == 0 {
            return <types:ReportGenerationResponse>{
                body: {}
            };
        }
        entity:LeaveEntity[]|error entityLeaves = entity:getLeaves({emails, isActive: true, startDate, endDate});
        if entityLeaves is error {
            log:printError(types:ERR_MSG_LEAVES_RETRIEVAL_FAILED, entityLeaves);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_LEAVES_RETRIEVAL_FAILED
                }
            };
        }

        return <types:ReportGenerationResponse>{
            body: getLeaveReportContent(entityLeaves)
        };
    }

    # Fetch report filters required for the reports UI.
    #
    # + employeeStatuses - Employee statuses to filter the employees
    # + return - Report filters
    resource function get report\-filters(string[]? employeeStatuses)
        returns types:ReportFiltersResponse|types:BadRequest|types:InternalServerError {
        entity:EmployeeStatus[] validEmployeeStatuses = [];
        if employeeStatuses is string[] {
            entity:EmployeeStatus[]|error clonedEmployeeStatuses = employeeStatuses.cloneWithType();
            if clonedEmployeeStatuses is error {
                return <types:BadRequest>{
                    body: {
                        message: types:ERR_MSG_INVALID_EMPLOYEE_STATUS
                    }
                };
            }

            validEmployeeStatuses = clonedEmployeeStatuses;
        }

        entity:OrgDataEntity|error orgData = entity:getOrgData(validEmployeeStatuses);
        if orgData is error {
            log:printError(types:ERR_MSG_ORAGNIZATION_DATA_RETRIEVAL_FAILED, orgData);
            return <types:InternalServerError>{
                body: {
                    message: orgData.message()
                }
            };
        }

        var {countries, orgStructure, flatList} = orgData;
        return <types:ReportFiltersResponse>{
            body: {
                countries: from string country in countries
                    order by country ascending
                    select country,
                orgStructure,
                flatList,
                employeeStatuses: [types:EmployeeStatusMarkedLeaver, types:EmployeeStatusActive, types:EmployeeStatusLeft]
            }
        };
    }

    # Fetch all the employees.
    #
    # + location - Employee location  
    # + businessUnit - Employee business unit 
    # + department - Employee department
    # + team - Employee team
    # + employeeStatuses - Employee statuses to filter the employees
    # + return - Return list of employee records
    resource function get employees(string? location, string? businessUnit, string? department, string? team, string[]? employeeStatuses)
        returns types:EmployeesResponse|types:InternalServerError {
        entity:EmployeeEntity[]|error employees = entity:getEmployees(location, businessUnit, department, team, employeeStatuses);
        if employees is error {
            log:printError(types:ERR_MSG_EMPLOYEES_RETRIEVAL_FAILED, employees);
            return {
                body: {
                    message: employees.message()
                }
            };
        }
        types:Employee[] employeesResponse = from entity:EmployeeEntity employee in employees
            select {
                firstName: employee.firstName,
                lastName: employee.lastName,
                workEmail: employee.workEmail,
                employeeThumbnail: employee.employeeThumbnail,
                location: employee.location
            };
        return <types:EmployeesResponse>{
            body: employeesResponse
        };

    }

    # Fetch an employee by email.
    #
    # + email - Employee email
    # + return - Return the employee record
    resource function get employees/[string email]() returns types:EmployeeResponse|types:InternalServerError {
        entity:EmployeeEntity|error employee = entity:getEmployee(email);
        if employee is error {
            log:printError(string `${types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED} Email: ${email}.`, employee);
            return <types:InternalServerError>{
                body: {
                    message: employee.message()
                }
            };
        }

        return <types:EmployeeResponse>{
            body: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                workEmail: employee.workEmail,
                employeeThumbnail: employee.employeeThumbnail,
                location: employee.location
            }
        };
    }

    # Fetch user calendar.
    #
    # + ctx - Request context  
    # + startDate - Strting date of the calendar  
    # + endDate - End date of the calendar
    # + return - Return user calendar
    resource function get user\-calendar(http:RequestContext ctx, string startDate, string endDate)
        returns types:UserCalendarResponse|types:InternalServerError {
        security:AsgardeoJwt|error decodedJwt = ctx.get(types:JWT_CONTEXT_KEY).ensureType();
        if decodedJwt is error {
            log:printError(types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED, decodedJwt);
            return {
                body: {
                    message: types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED
                }
            };
        }
        string email = decodedJwt.email;
        types:UserCalendarInformation|error userCalendarInformation = getUserCalendarInformation(email,
             startDate, endDate);
        if userCalendarInformation is error {
            return {
                body: {
                    message: userCalendarInformation.message()
                }
            };
        }

        return {
            body: {
                ...userCalendarInformation
            }
        };
    }

    # Fetch legally entitled leave for the given employee.
    #
    # + email - Employee email 
    # + ctx - Request context 
    # + years - Years to fetch leave entitlement. Empty array will fetch leave entitlement for current year
    # + return - Return leave entitlement
    resource function get employees/[string email]/leave\-entitlement(http:RequestContext ctx, int[] years = []) 
        returns types:LeaveEntitlementResponse|types:Forbidden|types:InternalServerError {
        security:AsgardeoJwt|error decodedJwt = ctx.get(types:JWT_CONTEXT_KEY).ensureType();
        if decodedJwt is error {
            log:printError(types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED, decodedJwt);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED
                }
            };
        }

        if email != decodedJwt.email {
            boolean validateForSingleRole = security:validateForSingleRole(decodedJwt, adminRoles);
            if !validateForSingleRole {
                security:logUnauthorizedUserAccess(decodedJwt.email, string `/leave-entitlement with email=${email.toString()}`);
                return <types:Forbidden>{
                    body: {
                        message: types:ERR_MSG_UNAUTHORIZED_VIEW_LEAVE
                    }
                };
            }
        }

        entity:EmployeeEntity|error employee = entity:getEmployee(email);
        if employee is error {
            log:printError(types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED, employee);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED
                }
            };
        }
        
        types:LeaveEntitlement[]|error leaveEntitlement = getLeaveEntitlement(employee, years);
        if leaveEntitlement is error {
            log:printError(types:ERR_MSG_LEAVE_ENTITLEMENT_RETRIEVAL_FAILED, leaveEntitlement);
            return <types:InternalServerError>{
                body: {
                    message: types:ERR_MSG_LEAVE_ENTITLEMENT_RETRIEVAL_FAILED
                }
            };
        }

        return <types:LeaveEntitlementResponse>{
            body: leaveEntitlement
        };
    }
}
