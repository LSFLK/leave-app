// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/jwt;

# Decode Asgardeo issued JWT 
#
# + jwtString - JWT token, type: string  
# + return - AsgardeoJwt or error
public isolated function decodeAsgardeoJwt(string jwtString) returns AsgardeoJwt|error {
    [jwt:Header, jwt:Payload] [_, payload] = check jwt:decode(jwtString);
    return payload.cloneWithType();
}

# Check if the logged in user has all the required roles in the groups claim.
#
# + jwt - JWT token, type: AsgardeoJwt
# + expectedRoles - expected roles to be in the jwt
# + return - true if jwt contains all the roles, false otherwise
public isolated function validateForAllRoles(AsgardeoJwt jwt, string[] expectedRoles) returns boolean {
    string[] roles = jwt.groups;
    foreach string role in expectedRoles {
        int? indexOfRole = roles.indexOf(role);
        if indexOfRole != () {
            return false;
        }
    }
    return true;
}

# Check if the logged in user has at least one requried role in the groups claim.
#
# + jwt - JWT token, type: AsgardeoJwt
# + expectedRoles - expected roles to be in the jwt
# + return - true if jwt contains at least one role, false otherwise
public isolated function validateForSingleRole(AsgardeoJwt jwt, string[] expectedRoles) returns boolean {
    string[] roles = jwt.groups;
    foreach string role in expectedRoles {
        int? indexOfRole = roles.indexOf(role);
        if indexOfRole != () {
            return true;
        }
    }
    return false;
}
