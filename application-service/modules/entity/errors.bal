// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// 
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/graphql;
import ballerina/log;

# Log GraphQL query response field errors (if exists) in the given GraphQL error object array.
#
# + graphQLErrors - GraphQL query response error detail array
# + entityName - Name of the entity
isolated function handleGraphQLResponseError(graphql:ErrorDetail[]? graphQLErrors, string entityName) {
    foreach var err in graphQLErrors ?: [] {
        log:printError(string `Error occurred while querying ${entityName} entity field: ${err.message}`);
    }
}

# Process GraphQL client errors in the given GraphQL error object.
#
# + graphQLError - GraphQL client error object
# + entityName - Name of the entity
# + return - Processed GraphQL client error object
isolated function handleGraphQLClientError(graphql:ClientError graphQLError, string entityName) returns error {
    if graphQLError is graphql:HttpError {
        return error(string `Error occurred while querying ${entityName} entity: `
            + string `${graphQLError.detail().body.toString()}`);
    } else if graphQLError is graphql:InvalidDocumentError || graphQLError is graphql:PayloadBindingError {
        graphql:ErrorDetail[]? graphQLErrors = graphQLError.detail().errors;
        string errDetail = "No error details found";

        if graphQLErrors is graphql:ErrorDetail[] {
            errDetail = string:'join(
                "; ",
                ...from graphql:ErrorDetail {message} in graphQLErrors
                select message
            );
        }
        return error(string `Error occurred while querying ${entityName} entity: ${errDetail}`);
    }
    return error(string `Error occurred while querying ${entityName} entity: Unknown error`);
}
