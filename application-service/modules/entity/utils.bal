// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

public const MAX_QUERY_PAGE_LIMIT = 1000;

# Function to get unique key for employee caching.
#
# + location - Employee location 
# + businessUnit - Employee business unit
# + department - Employee department
# + team - Employee team
# + employeeStatuses - Employee statuses
# + return - Unique key for employee caching
isolated function getFetchEmployeesCachingKey(string? location = (), string? businessUnit = (), string? department = (), 
    string? team = (), string[]? employeeStatuses = ()) returns string {
    return string `${EMPLOYEE_CACHE_KEY}-${location ?: "N"}-${businessUnit ?: "N"}-${
            department ?: "N"}-${team ?: "N"}-${employeeStatuses is string[] ? employeeStatuses.toJsonString() : "N"}`;
}
