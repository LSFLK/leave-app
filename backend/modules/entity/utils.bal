// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

public const MAX_QUERY_PAGE_LIMIT = 1000;

# Function to get unique key for caching employee data.
#
# + filter - Employee filter
# + return - A unique key string used for caching employee data.
isolated function getEmployeesCachingKey(EmployeeFilter filter = {}) returns string =>
    string `${EMPLOYEE_CACHE_KEY}-${filter.location ?: "N"}-${filter.businessUnit ?: "N"}-${filter.department ?: "N"}-${
        filter.team ?: "N"}-${filter.employeeStatus is string[] ? filter.employeeStatus.toJsonString() : "N"}-${
        filter.managerEmail ?: "N"}`;

# Function to generate a unique key for caching holiday data.
#
# + country - The country for which office holidays are retrieved 
# + startDate - The start date used as a filter
# + endDate - The end date used as a filter
# + return - A unique key string used for caching holiday data.
isolated function getHolidaysCachingKey(string country, string startDate, string endDate) returns string =>
    string `${HOLIDAY_CACHE_KEY}-${country}-${startDate}-${endDate}`;
