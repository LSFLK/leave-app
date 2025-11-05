// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import leave_app_application_service.security;
import leave_app_application_service.types;
import leave_app_application_service.utils;

import ballerina/http;

// Allowed user roles of the API
configurable string[] userRoles = ?;
// Allowed admin roles of the API
configurable string[] adminRoles = ?;

service class RequestInterceptor {
    *http:RequestInterceptor;
    resource function 'default [string... path](
            http:RequestContext ctx,
            http:Request req,
            @http:Header {name: "x-jwt-assertion"} string xJwtAssertion)
        returns types:Forbidden|http:NextService|error? {
        string method = req.method;
        if method == http:OPTIONS {
            return ctx.next();
        }

        security:AsgardeoJwt|error jwt = security:decodeAsgardeoJwt(xJwtAssertion);

        if jwt is error {
            return <types:Forbidden>{
                body: {message: types:NO_PRIVILEGES_ERROR}
            };
        }

        if !utils:isWso2Email(jwt.email) {
            return <types:Forbidden>{
                body: {message: types:NO_PRIVILEGES_ERROR}
            };
        }

        // Checks if the user is authorized to access the API
        boolean|error userIsAuthorized = security:validateForSingleRole(jwt, userRoles);
        if userIsAuthorized != true {
            security:logUnauthorizedUserAccess(jwt.email, req.rawPath, false);
            return <types:Forbidden>{
                body: {message: types:NO_PRIVILEGES_ERROR}
            };
        }

        // Checks if the user is authorized to access admin resources
        boolean isAdminOnlyPath = checkIfAdminOnlyPath(path, method);
        if isAdminOnlyPath {
            boolean|error userIsAdmin = security:validateForSingleRole(jwt, adminRoles);
            if userIsAdmin != true {
                security:logUnauthorizedUserAccess(jwt.email, req.rawPath, true);
                return <types:Forbidden>{
                    body: {message: types:NO_PRIVILEGES_ERROR}
                };
            }
        }

        ctx.set(types:JWT_CONTEXT_KEY, jwt);
        return ctx.next();
    }
}

# Check if path is only valid for admin users
#
# + path - Resource path
# + method - Request HTTP method
# + return - Boolean if path is only valid for admin users
function checkIfAdminOnlyPath(string[] path, string method) returns boolean {
    if path.length() > 0 {
        string resourcePath = path[0];
        if types:adminPathToAllowedMethods.hasKey(resourcePath) {
            string[] allowedMethods = types:adminPathToAllowedMethods.get(resourcePath);
            return allowedMethods.indexOf(method) !is ();
        }
    }

    return false;
}

