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
public isolated function decodeAsgardeoJwt(string jwtString) returns readonly & AsgardeoJwt|error {
    [jwt:Header, jwt:Payload] [_, payload] = check jwt:decode(jwtString);
    readonly & AsgardeoJwt|error jwt = payload.cloneWithType();
    if jwt is error {
        AsgardeoTokenExchangeJwt jwtTokenExchange = check payload.cloneWithType();
        return {
            email: jwtTokenExchange.sub,
            groups: []
        };
    }

    return jwt;
}

# Check if the logged in user has all the required roles in the groups claim.
#
# + jwt - JWT token, type: AsgardeoJwt
# + expectedRoles - expected roles to be in the jwt
# + return - true if jwt contains all the roles, false otherwise
public isolated function validateForAllRoles(readonly & AsgardeoJwt jwt, string[] expectedRoles) returns boolean =>
    expectedRoles.length() == 0 || expectedRoles.every(
        isolated function(string expectedRole) returns boolean =>
            jwt.groups.indexOf(expectedRole) !is ()
    );

# Check if the logged in user has at least one required role in the groups claim.
#
# + jwt - JWT token, type: AsgardeoJwt
# + expectedRoles - expected roles to be in the jwt
# + return - true if jwt contains at least one role, false otherwise
public isolated function validateForSingleRole(readonly & AsgardeoJwt jwt, string[] expectedRoles) returns boolean =>
    expectedRoles.length() == 0 || expectedRoles.some(
        isolated function(string expectedRole) returns boolean =>
            jwt.groups.indexOf(expectedRole) !is ()
    );
