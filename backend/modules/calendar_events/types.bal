// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# [Configurable] Choreo OAuth2 application configuration.
#
# + tokenUrl - OAuth2 token endpoint
# + clientId - OAuth2 client ID
# + clientSecret - OAuth2 client secret
type ChoreoApp record {|
    string tokenUrl;
    string clientId;
    string clientSecret;
|};

# Defines time.
#
# + date - The date, in the format "yyyy-mm-dd"
# + dateTime - A combined date-time value formatted according to RFC3339
# + timeZone - The time zone in which the time is specified
public type Time record {
    @display {label: "Date"}
    string date?;
    @display {label: "Date And Time"}
    string dateTime?;
    @display {label: "Time Zone"}
    string timeZone?;
};

# Represents the elements representing event input.
#
# + summary - Title of the event
# + description - Description of the event
# + location - Location of the event
# + colorId - Color Id of the event
# + id - Opaque identifier of the event
# + start - Start time of the event
# + end - End time of the event
# + recurrence - List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545
# + originalStartTime - The start time of the event in recurring events
# + transparency - Whether the event blocks time on the calendar
# + visibility - Visibility of the event
public type EventPayload record {
    @display {label: "Event Title"}
    string summary?;
    @display {label: "Event Description"}
    string description?;
    @display {label: "Event Location"}
    string location?;
    @display {label: "Event Color Id"}
    string colorId?;
    @display {label: "Event Id"}
    string id?;
    @display {label: "Event Start Time"}
    Time 'start;
    @display {label: "Event End Time"}
    Time end;
    @display {label: "Recurrence Config"}
    string[] recurrence?;
    @display {label: "Start Time in Recurrent Event"}
    Time originalStartTime?;
    @display {label: "Time Blocks Config"}   
    string transparency?;
    @display {label: "Event Visibility"}
    string visibility?;
};

# Server Message.
#
# + message - Human readable error message
# + id - Id of the created object
public type CreatedMessage record {|
    string message?;
    string id?;
|};

# Server Message for event deletion
# 
# + message - Human readable error message
public type DeletedMessage record {|
    string message?;
|};