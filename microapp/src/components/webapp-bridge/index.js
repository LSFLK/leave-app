import { OAUTH_CONFIG } from "../../config";

var idToken = null;
var userName = "";
var userRoles = [];
var userPrivileges = [];

var accessToken = null;

var refreshTokenFunction = null;
var sessionClearFunction = null;
var getNewTokenTries = 0;
var tokenRefreshRequests = [];

var isLoggedOut = false;

export function setIsLoggedOut(status) {
    isLoggedOut = status;
}

export function getIsLoggedOut() {
    return isLoggedOut;
}

export function setIdToken(token) {
    idToken = token;
}

export function getIdToken() {
    return idToken;
}

export function setUserName(user) {
    userName = user;
}

export function getUserName() {
    return userName;
}

export function setUserPrivileges(privileges) {
    userPrivileges = privileges;
}

export function getUserPrivileges() {
    return userPrivileges;
}

export function setUserRoles(rolesFromJWT) {
    if (typeof rolesFromJWT === 'string') {
        userRoles = rolesFromJWT.split(',');
    } else if (Array.isArray(rolesFromJWT)) {
        userRoles = rolesFromJWT.slice();
    }
}

export function getUserRoles() {
    return userRoles;
}

export async function handleTokenFailure(callback) {
    tokenRefreshRequests.push(callback);
    if (tokenRefreshRequests.length === 1) {
        try {
            await refreshToken();
            let callbacksToRun = tokenRefreshRequests.slice();
            callbacksToRun.forEach(e => {
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
}

export function getAccessToken() {
    return accessToken;
}

export const refreshToken = async (resolve) => {
    if (!refreshTokenFunction) {
        throw "Refresh token function is not set";
    }

    refreshTokenFunction().then((response) => {
        setIdToken(response);
        setAccessToken(response);
    });
}
