// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// 
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/graphql;
import ballerina/lang.value;
import ballerina/log;

# Log GraphQL query response field errors (if exists) in the given GraphQL error object array.
#
# + graphQlErrors - GraphQL query response error detail array
# + entityName - Name of the entity
isolated function handleGraphQlResponseError(graphql:ErrorDetail[]? graphQlErrors, string entityName) {
    foreach var err in graphQlErrors ?: [] {
        log:printError(string `Error occurred while querying ${entityName} entity field: ${err.message}`);
    }
}

# Process GraphQL client errors in the given GraphQL error object.
#
# + graphQlError - GraphQL client error object
# + entityName - Name of the entity
# + return - Processed GraphQL client error object
isolated function handleGraphQlClientError(graphql:ClientError graphQlError, string entityName) returns error {
    if graphQlError is graphql:HttpError {
        return error(string `Error occurred while querying ${entityName} entity: `
            + string `${graphQlError.detail().body.toString()}`);
    } else if graphQlError is graphql:InvalidDocumentError || graphQlError is graphql:PayloadBindingError {
        graphql:ErrorDetail[]? graphQlErrors = graphQlError.detail().errors;
        string errDetail = "No error details found";

        if graphQlErrors is graphql:ErrorDetail[] {
            errDetail = string:'join(
                "; ",
                ...from graphql:ErrorDetail {message} in graphQlErrors
                select message
            );
        } else {
            error? cause = graphQlError.cause();
            if cause is error {
                map<value:Cloneable> & readonly detail = cause.detail();
                if detail.hasKey("message") {
                    errDetail = check detail["message"].ensureType();
                }
            }
        }
        return error(string `Error occurred while querying ${entityName} entity: ${errDetail}`);
    }
    return error(string `Error occurred while querying ${entityName} entity: Unknown error`);
}
