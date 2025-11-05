// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.types;

import ballerina/http;
import ballerina/lang.regexp;
import ballerina/log;
import ballerina/time;

# Get timestamp from a string in ISO 8601 format. This date will be timezone independent.
#
# + date - String date in ISO 8601 format
# + return - Return timestamp
public isolated function getTimestampFromDateString(string date) returns string {
    string timestamp = date;
    if regexp:find(types:REGEX_DATE_YYYY_MM_DD, date) is regexp:Span {
        timestamp = date.substring(0, 10) + "T00:00:00Z";
    }

    return timestamp;
}

# Get the date string in ISO 8601 format from timestamp.
#
# + timestamp - Timestamp
# + return - String date in ISO 8601 format
public isolated function getDateStringFromTimestamp(string timestamp) returns string {
    if regexp:isFullMatch(types:REGEX_DATE_YYYY_MM_DD_T_HH_MM_SS, timestamp) ||
        regexp:isFullMatch(types:REGEX_DATE_YYYY_MM_DD_T_HH_MM_SS_SSS, timestamp) {
        return timestamp.substring(0, 10);
    }

    return timestamp;
}

# Convert timestamp (ex: 2023-01-01T00:00:00Z) to email date string (ex:Sun, 1 Jan 2023).
#
# + timestamp - Timestamp string
# + return - Email date string
public isolated function getEmailDateStringFromTimestamp(string timestamp) returns string {
    time:Civil|types:ValidationError civilDateFromString = getCivilDateFromString(timestamp);
    if civilDateFromString is time:Civil {
        int year = civilDateFromString.year;
        string dayOfWeek = civilDateFromString.dayOfWeek.toString();
        string month = getMonthString(<Month>civilDateFromString.month).substring(0, 3);
        match civilDateFromString.dayOfWeek {
            0 => {
                dayOfWeek = "Sun,";
            }
            1 => {
                dayOfWeek = "Mon,";
            }
            2 => {
                dayOfWeek = "Tue,";
            }
            3 => {
                dayOfWeek = "Wed,";
            }
            4 => {
                dayOfWeek = "Thu,";
            }
            5 => {
                dayOfWeek = "Fri,";
            }
            6 => {
                dayOfWeek = "Sat,";
            }
        }

        return string `${dayOfWeek} ${civilDateFromString.day} ${month} ${year}`;
    }

    return timestamp;
}

# Get date string in ISO 8601 format from UTC date.
#
# + utcDate - UTC Date
# + return - String date in ISO 8601 format
public isolated function getDateStringFromUtcDate(time:Utc utcDate) returns string {
    string utcToString = time:utcToString(utcDate);
    return getDateStringFromTimestamp(utcToString);
}

# Get UTC date from a string in ISO 8601 format. This date will be timezone independent.
#
# + date - String date in ISO 8601 format
# + return - Return UTC date or error for validation failure
public isolated function getUtcDateFromString(string date) returns time:Utc|types:ValidationError {
    string timestamp = getTimestampFromDateString(date);
    time:Utc|time:Error utcDate = time:utcFromString(timestamp);
    if utcDate is time:Error {
        log:printError(string `${types:ERR_MSG_INVALID_DATE_FORMAT} Date: ${date} Timestamp: ${timestamp}`);
        return error(utcDate.message(), externalMessage = types:ERR_MSG_INVALID_DATE_FORMAT);
    }

    return utcDate;
}

# Get Civil date from a string in ISO 8601 format. This date will be timezone independent.
#
# + date - String date in ISO 8601 format
# + return - Return Civil date or error for validation failure
public isolated function getCivilDateFromString(string date) returns time:Civil|types:ValidationError {
    time:Civil|time:Error civilDate = time:civilFromString(getTimestampFromDateString(date));
    if civilDate is error {
        return error(civilDate.message(), externalMessage = types:ERR_MSG_INVALID_DATE_FORMAT, code = http:STATUS_BAD_REQUEST);
    }

    return civilDate;
}

public isolated function getFormattedDate(string date) returns string|error {
    time:Civil|types:ValidationError civilDate = getCivilDateFromString(date);
    if civilDate is types:ValidationError {
        return civilDate;
    }

    return string `${civilDate.day} ${getMonthString(<Month>civilDate.month)} ${civilDate.year}`;
}

# Date range validation function.
#
# + startDate - Start date of the range
# + endDate - End date of the range
# + return - Returns UTC start and end dates or error for validation failure
public isolated function validateDateRange(string startDate, string endDate) returns [time:Utc, time:Utc]|error {
    do {
        time:Utc startUtc = check getUtcDateFromString(startDate);
        time:Utc endUtc = check getUtcDateFromString(endDate);

        if startUtc > endUtc {
            return error(types:ERR_MSG_END_DATE_BEFORE_START_DATE);
        }

        return [startUtc, endUtc];
    } on fail error err {
        string errorMessage = err.message();
        if err is types:ValidationError {
            errorMessage = err.detail().externalMessage;
        }

        return error(errorMessage);
    }
}

# Function to check if a given date is a weekday (Monday to Friday).
#
# + date - Date to check
# + return - Returns true if the date is a weekday, false otherwise
public isolated function checkIfWeekday(time:Civil|time:Utc date) returns boolean {
    time:Civil civil;
    if date is time:Utc {
        civil = time:utcToCivil(date);
    } else {
        civil = date;
    }

    return !(civil.dayOfWeek == time:SATURDAY || civil.dayOfWeek == time:SUNDAY);
}

# Function to get the weekdays within a date range.
#
# + startDate - Start date 
# + endDate - End date
# + return - Return Utc array of weekdays
public isolated function getWeekdaysFromRange(time:Utc startDate, time:Utc endDate) returns types:Day[] {
    types:Day[] weekdays = [];
    time:Utc utcToCheck = startDate;
    while utcToCheck <= endDate {
        if checkIfWeekday(utcToCheck) {
            weekdays.push({date: time:utcToString(utcToCheck)});
        }
        utcToCheck = time:utcAddSeconds(utcToCheck, 86400);
    }
    return weekdays;
}

# Function to get the number of days within a date range.
#
# + startDate - Start date  
# + endDate - End date
# + return - Return number of days
public isolated function getNumberOfDaysFromRange(time:Utc startDate, time:Utc endDate) returns float {
    return <float>time:utcDiffSeconds(endDate, startDate) / 86400;
}

# Add days to a given UTC date.
#
# + date - Start date  
# + numberOfDays - Number of days to add
# + return - UTC Date after adding number of days
public isolated function addDaysToDate(string date, int numberOfDays) returns string|error {
    decimal totalSeconds = 86400 * numberOfDays;
    time:Utc utcDateFromString = check getUtcDateFromString(date);
    return getDateStringFromUtcDate(time:utcAddSeconds(utcDateFromString, totalSeconds));
}

# Get month string from month enum.
#
# + month - Month enum
# + return - Return month string
public isolated function getMonthString(readonly & Month month) returns string {
    match month {
        JANUARY => {
            return "January";
        }
        FEBRUARY => {
            return "February";
        }
        MARCH => {
            return "March";
        }
        APRIL => {
            return "April";
        }
        MAY => {
            return "May";
        }
        JUNE => {
            return "June";
        }
        JULY => {
            return "July";
        }
        AUGUST => {
            return "August";
        }
        SEPTEMBER => {
            return "September";
        }
        OCTOBER => {
            return "October";
        }
        NOVEMBER => {
            return "November";
        }
        DECEMBER => {
            return "December";
        }
        _ => {
            return month.toString();
        }
    }
}

# Get current year.
# + return - Return current year
public isolated function getCurrentYear() returns int =>
    time:utcToCivil(time:utcNow()).year;

# Get start date of a given year or current year.
#
# + date - Date to consider
# + year - Year to consider when date is not passed
# + return - Start date of year
public isolated function getStartDateOfYear(time:Utc? date = (), int? year = ()) returns string {
    time:Civil civilDate = time:utcToCivil(date ?: time:utcNow());
    return string `${year ?: civilDate.year}-01-01T00:00:00Z`;
}

# Get end date of a given year or current year.
#
# + date - Date to consider
# + year - Year to consider when date is not passed
# + return - End date of year
public isolated function getEndDateOfYear(time:Utc? date = (), int? year = ()) returns string {
    time:Civil civilDate = time:utcToCivil(date ?: time:utcNow());
    return string `${year ?: civilDate.year}-12-31T00:00:00Z`;
}

# Validate if the given email is a WSO2 email address (has wso2.com or ws02.com domains).
#
# + email - email address to be validated
# + return - true or false
public isolated function isWso2Email(string email) returns boolean =>
    regexp:isFullMatch(types:REGEX_EMAIL_DOMAIN, email.toLowerAscii());

# Fetches user name from WSO2 email address.
#
# + email - Email address
# + return - User name
public isolated function getUserNameFromWso2Email(string email) returns string|error {
    if isWso2Email(email) {
        log:printError(string `Invalid email address email: ${email}.`);
        return error("Invalid email address.");
    }

    string:RegExp r = re `@`;
    string[] split = r.split(email);
    return split[0];
}

# Checks if a passed string is an empty.
#
# + stringToCheck - String to be checked
# + return - Whether the string is empty or not
public isolated function checkIfEmptyString(string stringToCheck) returns boolean {
    if stringToCheck.length() == 0 {
        return true;
    }

    return regexp:isFullMatch(types:REGEX_EMPTY_STRING, stringToCheck);
}
