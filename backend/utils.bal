// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.entity;

configurable string[] defaultRecipients = [];

public isolated function getAllEmailRecipientsForUser(string email, string[] userAddedRecipients)
    returns readonly & string[] {
    map<true> recipientMap = {
        [email] : true
    };
    foreach string defaultRecipient in defaultRecipients {
        recipientMap[defaultRecipient] = true;
    }

    entity:EmployeeEntity|error employee = entity:getEmployee(email);
    if employee is entity:EmployeeEntity && employee.managerEmail is string {
        recipientMap[<string>employee.managerEmail] = true;
    }

    foreach string recipient in userAddedRecipients {
        recipientMap[recipient] = true;
    }

    return recipientMap.keys().cloneReadOnly();
}

public isolated function getPrivateRecipientsForUser(string email, string[] userAddedRecipients)
    returns readonly & string[] {
    map<true> recipientMap = {
        [email] : true
    };

    entity:EmployeeEntity|error employee = entity:getEmployee(email);
    if employee is entity:EmployeeEntity && employee.managerEmail is string {
        recipientMap[<string>employee.managerEmail] = true;
    }

    foreach string recipient in userAddedRecipients {
        recipientMap[recipient] = true;
    }

    foreach string defaultRecipient in defaultRecipients {
        if recipientMap.hasKey(defaultRecipient) {
            _ = recipientMap.remove(defaultRecipient);
        }

    }

    return recipientMap.keys().cloneReadOnly();
}
