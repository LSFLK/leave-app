// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// 
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/graphql;
import ballerina/http;

configurable string hrEntityBaseUrl = ?;
configurable ChoreoApp choreoAppConfig = ?;

@display {
    label: "HRIS Entity GraphQL Service",
    id: "hris/entity-graphql-service"
}
public final graphql:Client hrClient = check new (hrEntityBaseUrl, {
    auth: {
        ...choreoAppConfig
    },
    http1Settings: {keepAlive: http:KEEPALIVE_NEVER},
    retryConfig: {
        count: 2,
        statusCodes: [
            http:STATUS_INTERNAL_SERVER_ERROR,
            http:STATUS_REQUEST_TIMEOUT,
            http:STATUS_BAD_GATEWAY,
            http:STATUS_SERVICE_UNAVAILABLE,
            http:STATUS_GATEWAY_TIMEOUT
        ]
    }
});
