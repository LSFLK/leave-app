// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/http;

# Calls the Google Calendar API to create event.
#
# + email - User email 
# + payload - Event payload
# + return - Event ID if returned or error
public isolated function createEvent(string email, EventPayload payload) returns string|error? {
    CreatedMessage response = check eventClient->/events/[email].post(payload, {
        "x-jwt-assertion": "x-jwt-assertion"
    });

    return response.id;
}

# Calls the Google Calendar API to Delete event.
#
# + email - User email 
# + eventId - Event ID
# + return - Error or nil
public isolated function deleteEvent(string email, string eventId) returns error? {
    http:Response response = check eventClient->/events/[email]/[eventId].delete({
        "x-jwt-assertion": "x-jwt-assertion"
    });

    if response.statusCode != http:STATUS_OK {
        return error(string `Event deletion unsuccessful. Status code: ${response.statusCode}.`);
    }
}
