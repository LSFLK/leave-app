// Copyright (c) 2022, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# Choreo JWT token, if Asgardeo is configured as Choreo Key Manager, this JWT token will be used.
#
# + email - Email address of the user
# + groups - Groups of the user, as a string array
public type AsgardeoJwt record {
    string email;
    string[] groups;
};
