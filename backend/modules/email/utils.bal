// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.utils;

# Validates and if required, corrects the email addresses in the given emails list.
#
# + emailsList - List of email addresses to validate
# + return - List of valid email addresses
public isolated function getValidEmailRecipientsFromList(string[] emailsList) returns string[] {
    map<()> validEmailsMap = {};
    string:RegExp commaRegex = re `,`;
    foreach string email in emailsList {
        string[] emailCommaSplitList = commaRegex.split(email);

        foreach var emailToValidate in emailCommaSplitList {
            string trimmedEmailToValidate = emailToValidate.trim();
            if utils:isWso2Email(trimmedEmailToValidate) {
                validEmailsMap[trimmedEmailToValidate] = ();
            }
        }
    }

    return validEmailsMap.keys();
}

# Generate the email subject with the application name prefixed.
# 
# + subject - Email subject
# + return - Prefixed email subject
isolated function getPrefixedEmailSubject(string subject) returns string {
    string subjectTag = appName;
    return string `[${subjectTag}] - ${subject}`;
}
