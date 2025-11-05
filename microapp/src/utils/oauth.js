// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import config, { APPLICATION_CONFIG } from "../config";
import {
  getIdToken as getIdTokenWeb,
  getAccessToken as getAccessTokenWeb,
  setAccessToken as setAccessTokenWeb,
  refreshToken as refreshTokenWeb,
} from "../components/webapp-bridge/index";

var isAdmin = false;
var idToken = null;
var userName = "";
var country = "";
var userRoles = [];
var userPrivileges = [];

var accessToken = null;
var refreshToken = null;

var refreshTokenFunction = null;
var sessionClearFunction = null;
var getNewTokenTries = 0;
var tokenRefreshRequests = [];
var logoutFunction = null;

var isLoggedOut = false;

export function setIsAdmin(isAdmin, callback) {
  isAdmin = isAdmin;
  callback && callback();
}

export function getIsAdmin() {
  return isAdmin;
}

export function setLogoutFunction(func) {
  logoutFunction = func;
}

export function logout() {
  if (logoutFunction) {
    logoutFunction();
  }
}

export function setIsLoggedOut(status) {
  isLoggedOut = status;
}

export function getIsLoggedOut() {
  return isLoggedOut;
}

export function setIdToken(token) {
  idToken = token;
}

export function getIdToken(isTokenRefresh) {
  if (APPLICATION_CONFIG.isMicroApp) {
    return idToken;
  }

  if (isTokenRefresh) {
    refreshTokenWeb()
      .then((newToken) => {
        return getAccessTokenWeb();
      })
      .catch((error) => {
        console.error("Error while refreshing token!", error);
      });
  }
}

export function setUserName(user) {
  userName = user;
}

export function getUserName() {
  return userName;
}

export function setCountry(location) {
  country = location;
}

export function getCountry() {
  return country;
}

export function setUserPrivileges(privileges) {
  userPrivileges = privileges;
}

export function getUserPrivileges() {
  return userPrivileges;
}

export function setUserRoles(rolesFromJWT) {
  if (typeof rolesFromJWT === "string") {
    userRoles = rolesFromJWT.split(",");
  } else if (Array.isArray(rolesFromJWT)) {
    userRoles = rolesFromJWT.slice();
  }
}

export function getUserRoles() {
  return userRoles;
}

export function checkIfRolesExist(roles, customRoles) {
  var isTrue = false;
  if (roles) {
    roles.forEach((role) => {
      if (
        userRoles.includes(role) ||
        (customRoles && customRoles.includes(role))
      ) {
        isTrue = true;
        return;
      }
    });
  }

  return isTrue;
}

export async function handleTokenFailure(callback) {
  tokenRefreshRequests.push(callback);
  if (tokenRefreshRequests.length === 1) {
    try {
      let accessToken = await refreshTokens();

      let callbacksToRun = tokenRefreshRequests.slice();
      callbacksToRun.forEach((e) => {
        let callbackFn = tokenRefreshRequests.shift();
        callbackFn && callbackFn();
      });
    } catch (e) {
      console.error("Could not refresh access token!", e);
      sessionClearFunction && sessionClearFunction();
    } finally {
      tokenRefreshRequests = [];
    }
  }
}

export function setRefreshTokenFunction(refreshFunction) {
  refreshTokenFunction = refreshFunction;
}

export function setSessionClearFunction(sessionClearFn) {
  sessionClearFunction = sessionClearFn;
}

export function setAccessToken(token) {
  accessToken = token;
  // setAccessTokenWeb(token);
}

export function getAccessToken() {
  // return getAccessTokenWeb();
  return accessToken;
}

function setRefreshToken(token) {
  refreshToken = token;
}

export function getRefreshToken() {
  return refreshToken;
}

export const revokeTokens = async (callbackFn) => {
  if (!accessToken) {
    if (callbackFn) {
      callbackFn();
    }

    return null;
  }

  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  let token =
    encodeURIComponent("token") + "=" + encodeURIComponent(accessToken);
  let clientId =
    encodeURIComponent("client_id") +
    "=" +
    encodeURIComponent(config.OAUTH_CONFIG.TOKEN_APIS.CLIENT_ID);

  let formBody = [token, clientId];

  try {
    const fetchResult = fetch(
      config.OAUTH_CONFIG.TOKEN_APIS.APIM_REVOKE_ENDPOINT,
      {
        method: "POST",
        headers: headers,
        body: formBody.join("&"),
      }
    );
    const response = await fetchResult;

    if (response.ok) {
      if (callbackFn) {
        callbackFn();
      }
    } else {
      console.error(
        "Error when calling token revoke endpoint! ",
        response.status,
        " ",
        response.statusText
      );
    }
  } catch (exception) {
    console.error("Token revocation failed: ", exception);
  }
};

export const getUserEmail = () => {
  let decodedToken = decodeToken(getAccessToken());
  if (decodedToken) {
    if (decodedToken.email) {
      return decodedToken.email;
    }
    if (decodedToken.sub) {
      return decodedToken.sub;
    }
  }
  return null;
};

// function to decode the JWT and retrieve token
export const decodeToken = (token) => {
  if (!token) {
    return null;
  }

  let tokenParts = token.split(".");
  let encodedPayload = tokenParts[1];
  let decodedPayload = atob(encodedPayload);
  return JSON.parse(decodedPayload);
};

export const getNewTokens = async (resolve, failFn) => {
  if (!idToken) {
    return null;
  }

  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  let grantType =
    encodeURIComponent("grant_type") +
    "=" +
    encodeURIComponent("urn:ietf:params:oauth:grant-type:token-exchange");
  let subjectTokenType =
    encodeURIComponent("subject_token_type") +
    "=" +
    encodeURIComponent("urn:ietf:params:oauth:token-type:jwt");
  let requestTokenType =
    encodeURIComponent("requested_token_type") +
    "=" +
    encodeURIComponent("urn:ietf:params:oauth:token-type:jwt");
  let assertion =
    encodeURIComponent("subject_token") + "=" + encodeURIComponent(idToken);
  let clientId =
    encodeURIComponent("client_id") +
    "=" +
    encodeURIComponent(config.OAUTH_CONFIG.TOKEN_APIS.CLIENT_ID);
  let clientSecret =
    encodeURIComponent("client_secret") +
    "=" +
    encodeURIComponent(config.OAUTH_CONFIG.TOKEN_APIS.CLIENT_SECRET);
  //let scope = encodeURIComponent("scope") + "=" + encodeURIComponent("openid");

  let formBody = [
    grantType,
    assertion,
    clientId,
    clientSecret,
    subjectTokenType,
    requestTokenType,
  ];

  try {
    const fetchResult = fetch(
      config.OAUTH_CONFIG.TOKEN_APIS.APIM_TOKEN_ENDPOINT,
      {
        method: "POST",
        headers: headers,
        body: formBody.join("&"),
      }
    );
    const response = await fetchResult;
    const jsonData = await response.json();

    if (response.ok) {
      if (jsonData) {
        let accessToken = jsonData.access_token;
        let refreshToken = jsonData.refresh_token;
        if (accessToken && refreshToken) {
          getNewTokenTries = 0;
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          resolve && resolve();
        } else {
          //Checking for resolve avoids infinite looping
          if (!resolve && getNewTokenTries < 4) {
            getNewTokenTries++;
            handleTokenFailure();
          } else {
            throw (
              "Error when retrieving data from token endpoint! " +
              response.status
            );
          }
        }
      }
    } else {
      console.error(
        "Error when calling token endpoint! ",
        response.status,
        " ",
        response.statusText
      );
      throw "Error when calling token endpoint! " + response.status;
    }
  } catch (exception) {
    console.error("Get new tokens failed: ", exception);
    throw exception;
  }
};

export const refreshTokens = async (resolve) => {
  if (!refreshToken) {
    throw "Refresh token is not found";
  }

  let headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  let grantType =
    encodeURIComponent("grant_type") +
    "=" +
    encodeURIComponent("urn:ietf:params:oauth:grant-type:token-exchange");
  let subjectTokenType =
    encodeURIComponent("subject_token_type") +
    "=" +
    encodeURIComponent("urn:ietf:params:oauth:token-type:jwt");
  let requestTokenType =
    encodeURIComponent("requested_token_type") +
    "=" +
    encodeURIComponent("urn:ietf:params:oauth:token-type:jwt");
  let _refreshToken =
    encodeURIComponent("refresh_token") +
    "=" +
    encodeURIComponent(refreshToken);
  let clientId =
    encodeURIComponent("client_id") +
    "=" +
    encodeURIComponent(config.OAUTH_CONFIG.TOKEN_APIS.CLIENT_ID);
  let clientSecret =
    encodeURIComponent("client_secret") +
    "=" +
    encodeURIComponent(config.OAUTH_CONFIG.TOKEN_APIS.CLIENT_SECRET);
  let scope = encodeURIComponent("scope") + "=" + encodeURIComponent("openid");

  let formBody = [grantType, _refreshToken, clientId, clientSecret];

  try {
    const fetchResult = fetch(
      config.OAUTH_CONFIG.TOKEN_APIS.APIM_TOKEN_ENDPOINT,
      {
        method: "POST",
        headers: headers,
        body: formBody.join("&"),
      }
    );
    const response = await fetchResult;
    const jsonData = await response.json();

    if (response.ok) {
      if (jsonData) {
        let accessToken = jsonData.access_token;
        let refreshToken = jsonData.refresh_token;
        if (accessToken && refreshToken) {
          getNewTokenTries = 0;
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          resolve && resolve();
        } else {
          //Checking for resolve avoids infinite looping
          if (!resolve && getNewTokenTries < 4) {
            getNewTokenTries++;
            handleTokenFailure();
          } else {
            throw (
              "Error when retrieving data from token endpoint! " +
              response.status
            );
          }
        }
      }
    } else {
      console.error(
        "Error when calling token endpoint! ",
        response.status,
        " ",
        response.statusText
      );

      if (refreshTokenFunction) {
        let returnedIdToken = await refreshTokenFunction();

        if (returnedIdToken) {
          setIdToken(returnedIdToken);
          let accessToken = await getNewTokens();
        }
      }
    }
  } catch (exception) {
    console.error("Refresh tokens failed:  ", exception);
    throw exception;
  }
};
