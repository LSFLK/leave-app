// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/log;

# Logs the issue of user access.
#
# + path - Path of the resource  
# + err - Error that occurred while accessing the resource
public isolated function logUserAccessIssue(string path, error err) {
    log:printError(string `Error occurred while accessing the resource ${path}}`, 
        err, stackTrace = err.stackTrace());
}

# Logs the access of an unauthorized user to a resource.
#
# + unauthorizedUserEmail - Email of the unauthorized user  
# + path - Path of the resource  
# + isAdminResource - Whether the resource is an admin resource or not
public isolated function logUnauthorizedUserAccess(string unauthorizedUserEmail, string path, boolean isAdminResource = false) {
    log:printWarn(string `The user ${unauthorizedUserEmail} was not privileged to access the${isAdminResource ? " admin " : " "}resource ${path}`);
}
