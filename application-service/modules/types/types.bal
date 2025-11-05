// Copyright (c) 2022, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/http;

# Success API response for the Database update or create operations.
public type SuccessResult record {|
    # Number of rows affected by the operation
    int? affectedRowCount;
    # ID of the last inserted row or sequence value
    string|int? lastInsertId?;
    # Unique id for the operation
    string uniqueId?;
|};

# HTTP success response.
public type Success record {|
    *http:Ok;
    # ServerMessage object with the message
    ServerMessage body;
|};

# HTTP not found response.
public type NotFound record {|
    *http:NotFound;
    # ServerMessage object with the error message
    ServerMessage body;
|};

# HTTP bad request response.
public type BadRequest record {|
    *http:BadRequest;
    # ServerMessage object with the error message
    ServerMessage body;
|};

# RBAC permission error response.
public type Forbidden record {|
    *http:Forbidden;
    # ServerMessage object with the error message
    ServerMessage body;
|};

# LeaveApp Conflict error response, (example, when user is try to send a leave request for a date which is already taken)
public type Conflict record {|
    *http:Conflict;
    # ServerMessage object with the error message
    ServerMessage body;
|};

# LeaveApp Internal Server Error response.
public type InternalServerError record {|
    *http:InternalServerError;
    # ServerMessage object with the error message
    ServerMessage body;
|};

# Server Message
public type ServerMessage record {|
    # Human readable error message
    string message;
|};

# Response for fetching an employee
public type EmployeeResponse record {|
    *http:Ok;
    # Employee data record
    Employee body;
|};

# Response for fetching employees
public type EmployeesResponse record {|
    *http:Ok;
    # List of Employee records
    Employee[] body;
|};

# Employee record
public type Employee record {|
    # First name
    string? firstName;
    # Last name
    string? lastName;
    # WSO2 email
    string? workEmail;
    # Image URL of the employee
    string? employeeThumbnail;
    # Employee location
    string? location;
|};

# Employee status.
public enum EmployeeStatus {
    EmployeeStatusMarkedLeaver = "Marked leaver",
    EmployeeStatusActive = "Active",
    EmployeeStatusLeft = "Left"
}

# Response for report filters
public type ReportFiltersResponse record {|
    *http:Ok;
    # Report filters record
    record {|
        # List of countries
        string[] countries;
        # List of business units
        OrgItem[] orgStructure;
        # List of leave types
        string[][] flatList;
        # Employee statuses
        EmployeeStatus[] employeeStatuses;
    |} body;
|};

# OrgItem record
public type OrgItem record {
    # Name of the organizational item
    string name;
    # Level of the organizational item
    int level;
    # Type of the organizational item
    string 'type;
    # Type Name of the organizational item
    string typeName;
    # Children of the organizational item
    OrgItem[] children = [];
};

# Leave record.
public type Leave record {|
    # Leave ID
    int id;
    # Start date of the leave
    string startDate;
    # End date of the leave
    string endDate;
    # Whether the leave is active
    boolean isActive;
    # Type of the leave
    string leaveType;
    # Period type of the leave
    string periodType;
    # Whether the leave is a morning leave
    boolean? isMorningLeave;
    # Email of the employee
    string email;
    # Created date of the leave
    string createdDate;
    # List of email recipients
    string[] emailRecipients = [];
    # Number of days of the leave
    float numberOfDays;
    # Employee location
    string? location = ();
    # Whether the leave can be cancelled by the user
    boolean isCancelAllowed = false;
|};

public type LeaveStat record {|
    string 'type;
    float count;
|};

# Response for fetching leaves.
public type FetchLeavesResponse record {|
    *http:Ok;
    # List of leaves
    record {|
        Leave[] leaves;
        LeaveStat[] stats;
    |} body;
|};

# Leave period type.
public enum LeavePeriodType {
    MULTIPLE_DAYS_LEAVE = "multiple",
    ONE_DAY_LEAVE = "one",
    HALF_DAY_LEAVE = "half"
}

# Order by
public enum OrderBy {
    ASC,
    DESC
}

# Leave type
public enum LeaveType {
    CASUAL_LEAVE = "casual",
    SICK_LEAVE = "sick",
    ANNUAL_LEAVE = "annual",
    LIEU_LEAVE = "lieu",
    MATERNITY_LEAVE = "maternity",
    PATERNITY_LEAVE = "paternity"
}

# Uncounted leaves
public type UncountedLeaves LIEU_LEAVE;

# Paylod for calculating leave details.
public type LeaveCalculationPayload record {|
    # Start date of the leave
    string startDate;
    # End date of the leave
    string endDate;
    # Whether the leave is a morning leave
    boolean? isMorningLeave = ();
    # Period type of the leave
    LeavePeriodType periodType;
|};

# Paylod for leave creation.
public type LeavePayload record {|
    *LeaveCalculationPayload;
    # Type of the leave
    LeaveType leaveType = CASUAL_LEAVE;
    # List of email recipients
    string[] emailRecipients = [];
    # Calendar Event ID of the leave
    string? calendarEventId = ();
    # Comment of the leave
    string? comment = ();
    # Whether the leave is a public comment
    boolean isPublicComment = false;
    # Subject of email notification
    string? emailSubject = ();
|};

# Day record.
public type Day record {|
    # string date
    string date;
    # List of holidays
    Holiday[] holidays?;
|};

# Holiday record.
public type Holiday record {|
    # Title of the holiday
    string title;
    # Date of the holiday
    string date;
|};

# Calculated leave record.
public type CalculatedLeave record {|
    # Number of working days
    float workingDays;
    # Whether the leave has an overlap
    boolean hasOverlap;
    # Message of the leave
    string message?;
    # List of holidays
    Holiday[] holidays?;
|};

# Calculated leave response.
public type CalculatedLeaveResponse record {|
    *http:Ok;
    # Calculated leave record
    CalculatedLeave body;
|};

# Validation error code
public type ValidationErrorCode http:STATUS_BAD_REQUEST|http:STATUS_INTERNAL_SERVER_ERROR;

# Validation error detail record.
public type ValidationErrorDetail record {
    # Error message for response
    string externalMessage; // `message` is made a mandatory field
    # Error code for response
    ValidationErrorCode code = http:STATUS_INTERNAL_SERVER_ERROR;
};

# Validation error record
public type ValidationError error<ValidationErrorDetail>;

# Form data record.
public type FormData record {|
    # List of email recipients
    string[] emailRecipients = [];
    # List of lead emails
    string[] leadEmails;
    # Location of employee
    string? location = ();
    # Legally entitled leaves
    LeavePolicy legallyEntitledLeave?;
    # Leave report content
    ReportContent leaveReportContent = {};
    # List of leave types
    record {|
        string key;
        string value;
    |}[] leaveTypes = [
        {'key: "casual", value: "Other leave (Casual, Sick, etc.)"},
        {'key: "annual", value: "Annual leave/PTO"},
        {'key: "paternity", value: "Paternity leave"},
        {'key: "maternity", value: "Maternity leave"},
        {'key: "lieu", value: "Lieu leave"}
    ];
|};

# Response for form data.
public type FormDataResponse record {|
    *http:Ok;
    # Form data
    FormData body;
|};

# Report generation payload.
public type ReportPayload readonly & record {|
    # Start date of the report
    string? startDate = ();
    # End date of the report
    string? endDate = ();
    # Location of employees
    string? location = ();
    # Business unit of employees
    string? businessUnit = ();
    # Department of employees
    string? department = ();
    # Team of employees
    string? team = ();
    # Employee status list
    EmployeeStatus[]? employeeStatuses = [EmployeeStatusActive, EmployeeStatusMarkedLeaver];
|};

# Leaves report content.
public type ReportContent map<map<float>>;

# Report generation response.
public type ReportGenerationResponse record {|
    *http:Ok;
    # Report generation response
    ReportContent body;
|};

# User calendar content.
public type UserCalendarInformation record {|
    # List of leaves
    Leave[] leaves;
    # List of holidays
    Holiday[] holidays;
|};

# User calendar response.
public type UserCalendarResponse record {|
    *http:Ok;
    # User calendar content
    UserCalendarInformation body;
|};

# Leave Entitlement response.
public type LeaveEntitlementResponse record {|
    *http:Ok;
    # Leave Entitlement response
    LeaveEntitlement[] body;
|};

# Leave Entitlement record.
public type LeaveEntitlement record {|
    # Year of the leave entitlement
    int year;
    # Employee location
    string? location;
    # Leave policy
    LeavePolicy leavePolicy;
    # Leaves taken after policy adjustment
    LeavePolicy policyAdjustedLeave;
|};

# Leave Policy record.
public type LeavePolicy record {|
    # Annual leave count
    float? annual?;
    # Casual leave count
    float? casual?;
|};
