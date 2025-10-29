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

# [Configurable] Email alerting service configuration record.
#
# + uuid - Authorized app UUID provided by the Email service
# + from - Email sender
# + templateId - ID of the email template
public type EmailAlertConfig record {|
    string uuid;
    string 'from;
    string templateId;
|};

# Email notification details record.
public type EmailNotificationDetails record {|
    # Email subject
    string subject;
    # Email body
    string body;
|};
