// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.types;

import ballerina/cache;
import ballerina/graphql;
import ballerina/log;

final cache:Cache hrEntityCache = new (defaultMaxAge = 1800, cleanupInterval = 900);

final string EMPLOYEE_FIELDS = string `employeeId
    firstName
    lastName
    workEmail
    company
    location
    department
    managerEmail
    reportsToEmail
    team
    subTeam
    employeeStatus
    startDate
    finalDayOfEmployment
    lead
    employeeThumbnail
`;

# Get Employee from HR entity by email with caching.
#
# + email - Employee email
# + return - Return Employee entity
public isolated function getEmployee(string email) returns readonly & EmployeeEntity|error {
    any|cache:Error cachedEmployee = hrEntityCache.get(email);
    if cachedEmployee is readonly & EmployeeEntity {
        return cachedEmployee;
    }

    return getEmployeeFromEntity(email);
}

# Get Employee from HR entity by email.
#
# + email - Employee email
# + return - Return Employee entity
isolated function getEmployeeFromEntity(string email) returns readonly & EmployeeEntity|error {
    string query = string `
        query getEmployeeByEmail($email: String!) {
            employee(email: $email) {
                ${EMPLOYEE_FIELDS}
            }
        }`;

    GetEmployeeResponse|graphql:ClientError response = hrClient->execute(query, {email});
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
    final readonly & EmployeeEntity employee = response.data.employee;
    cache:Error? cachingResult = hrEntityCache.put(email, employee);
    if cachingResult is cache:Error {
        log:printError(string `Error with hrEntityCache when pushing email: ${email}.`);
    }

    return employee;
}

# Get Employees from HR entity with caching.
#
# + filter - EmployeeFilter for filtering employees
# + return - Return Employee entities
public isolated function getEmployees(EmployeeFilter filter = {}) returns readonly & EmployeeEntity[]|error {
    filter.employeeStatus = filter.employeeStatus ?: types:DEFAULT_EMPLOYEE_STATUSES;
    any|cache:Error cachedEmployees = hrEntityCache.get(getEmployeesCachingKey(filter.cloneReadOnly()));
    if cachedEmployees is readonly & EmployeeEntity[] {
        return cachedEmployees;
    }

    return getEmployeesFromEntity(filter);
}

# Get Employees from HR entity.
#
# + filter - EmployeeFilter for filtering employees
# + return - Return Employee entities
isolated function getEmployeesFromEntity(EmployeeFilter filter = {}) returns readonly & EmployeeEntity[]|error {
    boolean firstPage = true;
    int resultLength = 0;
    int 'limit = MAX_QUERY_PAGE_LIMIT;
    int offset = 0;
    string query = string `
        query getAllEmployees($filter: EmployeeFilter!, $limit: Int, $offset: Int) {
            employees(filter: $filter, limit: $limit, offset: $offset) {
                ${EMPLOYEE_FIELDS}
            }
        }`;
    filter.employeeStatus = filter.employeeStatus ?: types:DEFAULT_EMPLOYEE_STATUSES;
    map<true> employeeSet = {};
    EmployeeEntity[] queriedEmployees = [];
    while resultLength == 'limit || firstPage {
        map<anydata> variables = {
            filter,
            'limit,
            offset
        };

        GetEmployeesResponse|graphql:ClientError response = hrClient->execute(query, variables);
        if response is graphql:ClientError {
            return handleGraphQlClientError(response, HR_ENTITY_NAME);
        }
        handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
        foreach EmployeeEntity employee in response.data.employees {
            if !employeeSet.hasKey(employee.employeeId) {
                queriedEmployees.push(employee);
            }

            employeeSet[employee.employeeId] = true;
        }

        firstPage = false;
        resultLength = response.data.employees.length();
        offset += 'limit;
    }

    cache:Error? cachingResult = hrEntityCache.put(getEmployeesCachingKey(filter.cloneReadOnly()),
                queriedEmployees.cloneReadOnly());
    if cachingResult is error {
        log:printWarn("Error while caching employees: ", cachingResult);
    }

    return queriedEmployees.cloneReadOnly();
}

# Org structure fields for query
final string ORG_STRUCTURE_FIELDS = string `name
    level
    type
    typeName`;

# Get Organization Data for employees with given statuses if any with caching.
#
# + employeeStatuses - Employee statuses if any
# + return - Return OrgData Entity
public isolated function getOrgData(EmployeeStatus[]? employeeStatuses = ()) returns readonly & OrgDataEntity|error {
    any|cache:Error cachedOrgData = hrEntityCache.get(ORG_DATA_CACHE_KEY);
    if cachedOrgData is readonly & OrgDataEntity {
        return cachedOrgData;
    }

    return getOrgDataFromEntity(employeeStatuses);
}

# Get Organization Data for employees with given statuses if any.
#
# + employeeStatuses - Employee statuses if any
# + return - Return OrgData Entity
isolated function getOrgDataFromEntity(EmployeeStatus[]? employeeStatuses = ()) returns readonly & OrgDataEntity|error {
    string document = string `
        query orgDataQuery($employeeStatuses: [String!]) {
            orgData(employeeStatuses: $employeeStatuses) {
                orgLevelCount
                countries
                orgStructure {
                    ${ORG_STRUCTURE_FIELDS}
                    children {
                        ${ORG_STRUCTURE_FIELDS}
                        children {
                            ${ORG_STRUCTURE_FIELDS}
                        }
                    }
                }
                flatList
            }
        }
    `;

    GetOrgDataResponse|graphql:ClientError response = hrClient->execute(document, {employeeStatuses});
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
    final readonly & OrgDataEntity orgData = response.data.orgData;
    cache:Error? cachingResult = hrEntityCache.put(ORG_DATA_CACHE_KEY, orgData);
    if cachingResult is cache:Error {
        log:printError(string `Error while caching OrgData.`);
    }

    return orgData;
}

# Leave fields for query
final string LEAVE_FIELDS = string `id
    startDate
    endDate
    isActive
    leaveType
    email
    periodType
    isMorningLeave
    createdDate
    emailRecipients
    effectiveDays {
        date
        isMorningLeave
        type
        periodType
    }
    calendarEventId
    numberOfDays
    location
    emailId
    emailSubject
`;

# Get Leave from the HR entity by ID.
#
# + id - Leave ID
# + return - Return Leave entity
public isolated function getLeave(int id) returns readonly & LeaveEntity|error? {
    string query = string `
        query getLeave($id: Int!) {
            leave(id: $id) {
                ${LEAVE_FIELDS}
            }
        }`;
    GetLeaveResponse|graphql:ClientError response = hrClient->execute(query, {id});
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
    return response.data.leave;
}

# Get Leaves from the HR entity.
#
# + filter - LeaveFilter for filtering leaves  
# + 'limit - Limit for the query 
# + offset - Offset for the query
# + return - Return Leave entities
public isolated function getLeaves(LeaveFilter filter, int? 'limit = (), int? offset = 0) returns readonly & LeaveEntity[]|error {
    boolean firstPage = true;
    int resultLength = 0;
    int queryLimit = 'limit ?: MAX_QUERY_PAGE_LIMIT;
    int queryOffset = offset ?: 0;
    string query = string `
        query getLeaves($filter: LeaveFilter, $limit: Int, $offset: Int) {
            leaves(filter: $filter, limit: $limit, offset: $offset) {
                ${LEAVE_FIELDS}
            }
        }`;

    map<true> leaveSet = {};
    LeaveEntity[] leaves = [];
    while 'limit is () ? resultLength == queryLimit || firstPage : leaves.length() < 'limit {
        map<anydata> variables = {filter, 'limit: queryLimit, offset: queryOffset};
        GetLeavesResponse|graphql:ClientError response = hrClient->execute(query, variables);
        if response is graphql:ClientError {
            return handleGraphQlClientError(response, HR_ENTITY_NAME);
        }

        handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);

        foreach LeaveEntity leave in response.data.leaves {
            if !leaveSet.hasKey(leave.id.toString()) {
                leaves.push(leave);
            }

            leaveSet[leave.id.toString()] = true;
        }

        firstPage = false;
        resultLength = response.data.leaves.length();
        queryOffset += queryLimit;
    }

    return leaves.cloneReadOnly();
}

# Create Leave in the HR entity.
#
# + payload - LeavePayload for creating leave  
# + email - Email of the user creating the leave
# + return - Return Leave entity
public isolated function createLeave(types:LeavePayload payload, string email) returns readonly & LeaveEntity|error {
    string query = string `
        mutation insertLeave($input: LeaveInput!) {
            insertLeave(input: $input) {
                ${LEAVE_FIELDS}
            }
        }`;
    map<anydata> variables = {input: {...payload, email}};
    CreateLeaveResponse|graphql:ClientError response = hrClient->execute(query, variables);
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
    return response.data.insertLeave;
}

# Validate leave before leave creation in the HR entity.
#
# + payload - LeavePayload for creating leave  
# + email - Email of the user creating the leave
# + return - Return Leave entity
public isolated function validateLeave(types:LeavePayload payload, string email) returns readonly & LeaveEntity|error {
    string query = string `
        mutation validateLeave($input: LeaveInput!) {
            insertLeave(input: $input, isValidationOnlyMode: true) {
                ${LEAVE_FIELDS}
            }
        }`;
    map<anydata> variables = {input: {...payload, email}};
    ValidateLeaveResponse|graphql:ClientError response = hrClient->execute(query, variables);
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    readonly & LeaveEntity? validateLeave = response.data?.insertLeave;
    if validateLeave is () {
        graphql:ErrorDetail[]? errors = response.errors;
        if errors is graphql:ErrorDetail[] && errors.length() > 0 {
            string graphqlErrorMessage = errors[0].message;
            if graphqlErrorMessage is types:ValidationErrorMessage {
                return <types:ValidationError>error(errors[0].message, externalMessage = graphqlErrorMessage);
            }
        }
        return error(string `Error occurred while validating leave. Response: ${response.toString()}}`);
    }

    return validateLeave;
}

# Cancel Leave in the HR entity.
#
# + id - Leave ID
# + return - Return cancelled Leave entity
public isolated function cancelLeave(int id) returns LeaveEntity|error {
    string query = string `
        mutation cancelLeave($id: Int!) {
            cancelLeave(id: $id) {
                ${LEAVE_FIELDS}
            }
        }`;
    CancelLeaveResponse|graphql:ClientError response = hrClient->execute(query, {id});
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
    return response.data.cancelLeave;
}

# Fetch Office Holidays from the HR entity with caching.
#
# + country - Country of the office holidays
# + startDate - Start date filter
# + endDate - End date filter
# + return - Return Office Holidays entities
public isolated function getHolidays(string country, string startDate, string endDate) returns HolidayEntity[]|error {
    any|cache:Error cachedHolidays = hrEntityCache.get(getHolidaysCachingKey(country, startDate, endDate));
    if cachedHolidays is readonly & HolidayEntity[] {
        return cachedHolidays;
    }

    return getHolidaysFromEntity(country, startDate, endDate);
}

# Fetch Office Holidays from the HR entity.
#
# + country - Country of the office holidays  
# + startDate - Start date filter
# + endDate - End date filter
# + return - Return Office Holidays entities
isolated function getHolidaysFromEntity(string country, string startDate, string endDate) returns HolidayEntity[]|error {
    log:printInfo(string `Fetching holidays from HR entity for country: ${country}, startDate: ${startDate}, 
        endDate: ${endDate}`);
    string query = string `
        query getOfficeHolidays($country: String!, $startDate: String!, $endDate: String!) {
            officeHolidays(country: $country, startDate: $startDate, endDate: $endDate) {
                id
                country
                date
                title
            }
        }`;
    GetHolidaysResponse|graphql:ClientError response = hrClient->execute(query, {country, startDate, endDate});
    if response is graphql:ClientError {
        return handleGraphQlClientError(response, HR_ENTITY_NAME);
    }

    handleGraphQlResponseError(response.errors, HR_ENTITY_NAME);
    readonly & HolidayEntity[] officeHolidays = response.data.officeHolidays;
    cache:Error? cachingResult = hrEntityCache.put(getHolidaysCachingKey(country, startDate, endDate), officeHolidays);
    if cachingResult is error {
        log:printWarn("Error while caching employees: ", cachingResult);
    }

    return officeHolidays;
}
