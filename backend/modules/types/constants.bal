// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/lang.regexp;

public const decimal DAY_IN_SECONDS = 86400;
public const JWT_CONTEXT_KEY = "JWT_CONTEXT_KEY";
public const TOTAL_LEAVE_TYPE = "total";
public const TOTAL_EXCLUDING_LIEU_LEAVE_TYPE = "totalExLieu";
public const LEGAL_CAUSAL_LEAVE = "legalCausal";
public const LEGAL_ANNUAL_LEAVE = "legalAnnual";

// Regex
public final regexp:RegExp & readonly REGEX_EMAIL_DOMAIN = re `^[a-zA-Z][a-zA-Z0-9_\-\.]+@ws[o|0]2\.com$`;
public final regexp:RegExp & readonly REGEX_DATE_YYYY_MM_DD_ONLY = re `^\d{4}-\d{2}-\d{2}$`;
public final regexp:RegExp & readonly REGEX_DATE_YYYY_MM_DD = re `^\d{4}-\d{2}-\d{2}`;
public final regexp:RegExp & readonly REGEX_DATE_YYYY_MM_DD_T_HH_MM_SS = re `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$`;
public final regexp:RegExp & readonly REGEX_DATE_YYYY_MM_DD_T_HH_MM_SS_SSS = re `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z`;
public final regexp:RegExp & readonly REGEX_EMPTY_STRING = re `^\s*$`;

// Errors
public const GENERIC_ERROR = "Something went wrong while processing your request, please try again, or if the problem persists contact DT Team";
public const LEAVE_CONFLICT_ERROR = "You have already submitted a leave on this date(s)";
public const LEAVE_NO_WORKING_DATES_ERROR = "You have not selected any working days";
public const NO_PRIVILEGES_ERROR = "You do not have the privileges to perform this action. This attempt will be logged along with your IP address and email";
public const LEAVE_SUBMITTED = "Your leave request submitted successfully";

public const ERR_MSG_HTTP_CONTEXT_RETRIEVAL_FAILED = "Error occurred while retrieving JWT from request context.";
public const ERR_MSG_LEAVES_RETRIEVAL_FAILED = "Error occurred while retrieving leaves.";
public const ERR_MSG_HOLIDAYS_RETRIEVAL_FAILED = "Error occurred while retrieving holidays.";
public const ERR_MSG_LEGALLY_ENTITLED_LEAVE_RETRIEVAL_FAILED = "Error occurred while retrieving legally entitled leaves.";

public const ERR_MSG_LEAVE_SHOULD_BE_AT_LEAST_ONE_WEEKDAY = "Leave requests should contain at least one weekday.";
public const ERR_MSG_LEAVE_OVERLAPS_WITH_EXISTING_LEAVE = "Leave overlaps with existing leave(s).";
public const ERR_MSG_LEAVE_SHOULD_BE_AT_LEAST_ONE_WORKING_DAY = "Leave requests should contain at least one working day.";

public const ERR_MSG_LEAVE_IN_INVALID_STATE = "Leave is in an invalid state.";
public const ERR_MSG_INVALID_DATE_FORMAT = "Invalid date. Date string should be in ISO 8601 format.";
public const ERR_MSG_END_DATE_BEFORE_START_DATE = "End date cannot be before start date.";
public const ERR_MSG_EMPLOYEE_RETRIEVAL_FAILED = "Error occurred while retrieving employee.";
public const ERR_MSG_EMPLOYEES_RETRIEVAL_FAILED = "Error occurred while retrieving employees.";
public const ERR_MSG_EMPLOYEE_LOCATION_RETRIEVAL_FAILED = "Error occurred while retrieving employee location.";
public const ERR_MSG_ORGANIZATION_DATA_RETRIEVAL_FAILED = "Error occurred while retrieving organization data";
public const ERR_MSG_LEAVE_ENTITLEMENT_RETRIEVAL_FAILED = "Error occurred while retrieving leave entitlement.";

public const ERR_MSG_FORBIDDEN_TO_NON_LEADS = "You have not been assigned as a lead/manager to any employee.";
public const ERR_MSG_UNAUTHORIZED_VIEW_LEAVE = "You are not authorized to view the requested leaves.";
public const ERR_MSG_INVALID_EMPLOYEE_STATUS = "Invalid employee statuses provided";

public type ValidationErrorMessage ERR_MSG_LEAVE_SHOULD_BE_AT_LEAST_ONE_WEEKDAY|
    ERR_MSG_LEAVE_OVERLAPS_WITH_EXISTING_LEAVE|ERR_MSG_LEAVE_SHOULD_BE_AT_LEAST_ONE_WORKING_DAY;

public final readonly & EmployeeStatus[] DEFAULT_EMPLOYEE_STATUSES = [EmployeeStatusActive, EmployeeStatusMarkedLeaver];

public enum EmployeeLocation {
    LK = "Sri Lanka"
}

public final map<string> & readonly timezoneOffsetMap = {
    "Australia": "+10:00",
    "Brazil": "-03:00",
    "Canada": "-05:00",
    "US": "-07:00",
    "Sri Lanka": "+05:30",
    "UK": "+01:00",
    "Argentina": "-03:00",
    "Mexico": "-06:00",
    "Columbia": "-05:00",
    "Saudi Arabia": "+03:00",
    "Germany": "+01:00",
    "Greece": "+02:00",
    "France": "+01:00",
    "Netherland": "+01:00",
    "Spain": "+02:00",
    "India": "+05:30",
    "New Zealand": "+12:00",
    "Singapore": "+08:00"
};
