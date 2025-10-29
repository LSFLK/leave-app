// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// 
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.types;

import ballerina/graphql;

# Constants
const HR_ENTITY_NAME = "HR";
const EMPLOYEE_CACHE_KEY = "EMPLOYEE_CACHE_KEY";
const ORG_DATA_CACHE_KEY = "ORG_DATA_CACHE_KEY";
const HOLIDAY_CACHE_KEY = "HOLIDAY_CACHE_KEY";

# [Configurable] Choreo OAuth2 application configuration.
type ChoreoApp readonly & record {|
    # OAuth2 token endpoint URL
    string tokenUrl;
    # OAuth2 client ID
    string clientId;
    # OAuth2 client secret
    string clientSecret;
|};

# Fetched employee response from Entity Service.
type GetEmployeeResponse readonly & record {
    *graphql:GenericResponseWithErrors;
    # Employee data
    record {
        EmployeeEntity employee;
    } data;
};

# Fetched employees response from Entity Service.
type GetEmployeesResponse readonly & record {
    *graphql:GenericResponseWithErrors;
    # Employees data
    record {
        readonly & EmployeeEntity[] employees;
    } data;
};

# Employee Entity record.
public type EmployeeEntity readonly & record {
    # Employee ID
    string employeeId;
    # First name
    string? firstName;
    # Last name
    string? lastName;
    # WSO2 email
    string workEmail;
    # Company
    string? company;
    # Work location
    string? location;
    # Department
    string? department;
    # Email of the manager
    string? managerEmail;
    # Reporting lead chain (comma separated list)
    string? reportsToEmail;
    # Employee's team
    string? team;
    # Employee's sub team
    string? subTeam;
    # Employee status
    EmployeeStatus? employeeStatus;
    # Employment start date  
    string? startDate;
    # Employment end date
    string? finalDayOfEmployment;
    # Employee is a lead or not
    boolean? lead;
    # Image URL of the employee
    string? employeeThumbnail;
};

# Employee filter record.
public type EmployeeFilter record {|
    # Employee location
    string? location = ();
    # Employee business unit
    string? businessUnit = ();
    # Employee department
    string? department = ();
    # Employee team
    string? team = ();
    # Employee statuses
    string[]? employeeStatus = ();
    # Employee manager email
    string? managerEmail = ();
|};

# Employee status.
public enum EmployeeStatus {
    EmployeeStatusMarkedLeaver = "Marked leaver",
    EmployeeStatusActive = "Active",
    EmployeeStatusLeft = "Left"
}

# Fetched Org Data response from Entity Service. 
type GetOrgDataResponse readonly & record {|
    *graphql:GenericResponseWithErrors;
    # Org Data
    record {
        OrgDataEntity orgData;
    } data;
|};

# OrgData Entity record.
public type OrgDataEntity readonly & record {|
    # Number of organizational levels
    int orgLevelCount;
    # Employee countries
    readonly & string[] countries;
    # Organizational structure
    readonly & types:OrgItem[] orgStructure;
    # Organizational items as separate lists for each org level
    readonly & string[][] flatList;
|};

# Leave Day record.
#
# + date - Date of the leave  
# + 'type - Type of the leave  
# + isMorningLeave - Is morning leave 
# + periodType - Period type of the leave
public type LeaveDay record {|
    string date;
    string 'type;
    boolean? isMorningLeave?;
    string periodType;
|};

# Leave Entity record.
public type LeaveEntity record {|
    # Leave ID
    readonly & int id;
    # Start date
    string startDate;
    # End date
    string endDate;
    # Is leave active
    boolean isActive;
    # Leave type
    string leaveType;
    # Leave period type
    string periodType;
    # Is morning leave
    boolean? isMorningLeave;
    # Email of the employee
    string email;
    # Created date
    string createdDate;
    # Email recipients
    readonly & string[] emailRecipients = [];
    # Effective days
    readonly & LeaveDay[] effectiveDays = [];
    # Calendar event ID
    string? calendarEventId;
    # Number of days
    float numberOfDays;
    # Employee location
    string? location;
    # ID of email notification
    string? emailId = ();
    # Subject of email notification
    string? emailSubject = ();
|};

# Order by method.
public enum OrderBy {
    ASC,
    DESC
}

# Leave filter record.
public type LeaveFilter record {|
    # Start date
    string startDate?;
    # End date
    string endDate?;
    # Leave type
    string[] leaveTypes?;
    # Leave period type
    string periodType?;
    # Emails of the employees
    string[] emails?;
    # Order by
    OrderBy? orderBy?;
    # Is leave active
    boolean? isActive?;
|};

# Fetched Leave response from Entity Service. 
type GetLeaveResponse readonly & record {|
    *graphql:GenericResponseWithErrors;
    # Leave response
    record {
        LeaveEntity? leave;
    } data;
|};

# Fetched Leaves response from Entity Service. 
type GetLeavesResponse readonly & record {|
    *graphql:GenericResponseWithErrors;
    # Leaves response
    record {
        LeaveEntity[] leaves;
    } data;
|};

# Create Leave response from Entity Service.
#
type CreateLeaveResponse readonly & record {|
    *graphql:GenericResponseWithErrors;
    # Created leave response
    record {
        LeaveEntity insertLeave;
    } data;
|};

# Validated Leave response from Entity Service.
type ValidateLeaveResponse readonly & record {|
    # Error details
    graphql:ErrorDetail[] errors?;
    # Meta information on protocol extensions
    map<json?> extensions?;
    # Validated leave response
    record {
        LeaveEntity insertLeave;
    }? data;
|};

# Cancel Leave response from Entity Service.
type CancelLeaveResponse readonly & record {|
    *graphql:GenericResponseWithErrors;
    # Cancel leave response
    record {
        LeaveEntity cancelLeave;
    } data;
|};

# Holiday Entity record.
public type HolidayEntity readonly & record {|
    # Holiday ID
    string id;
    # Holiday title
    string title;
    # Holiday date
    string date;
    # Holiday country
    string country;
|};

# Holidays filter record.
public type HolidaysFilter record {|
    # Start date
    string startDate?;
    # End date
    string endDate?;
    # Country
    string country;
|};

# Fetched Holidays response from Entity Service. 
type GetHolidaysResponse readonly & record {|
    *graphql:GenericResponseWithErrors;
    # Holidays response
    record {
        HolidayEntity[] officeHolidays;
    } data;
|};
