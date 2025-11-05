// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { getAccessToken, setIdToken, setAccessToken } from "./oauth";
import { INPUT_INVALID_MSG_GATEWAY } from "../constants";
import { getToken } from "../components/microapp-bridge";

const useHttp = () => {
  const MAX_TRIES = 2;

  const handleRequest = async (
    url,
    method,
    body,
    successFn,
    failFn,
    loadingFn,
    headers,
    currentTry
  ) => {
    if (!currentTry) {
      currentTry = 1;
    }

    try {
      if (loadingFn) {
        loadingFn(true);
      }

      var encodedUrl = encodeURI(url);
      const response = await fetch(encodedUrl, {
        method: method,
        body: body ? JSON.stringify(body) : null,
        headers: headers || {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
          "x-jwt-assertion": getAccessToken(),
        },
      });

      let responseBody = "";
      let isGatewayForbidden = false;

      // Assumptions
      // The only reason we may get 403 responses from Gateway is due to user input validation issues (rules blocking certain user inputs).
      // The other reasons may be due to code-level issues. But we assume they are already fixed after testing.
      // We only show the custom error msg for post / patch / put requests
      // We also assume that the gateway is sending a html page in response (therefore no json body and therefore handled in catch)
      try {
        responseBody = await response.json();
      } catch (e) {
        if (response.status === 403) {
          isGatewayForbidden = true;
        }
      } finally {
        let customErrMsg = "";

        if (isGatewayForbidden) {
          customErrMsg = INPUT_INVALID_MSG_GATEWAY;
        }

        if (
          response.status === 200 ||
          response.status === 201 ||
          response.status === 202
        ) {
          successFn(responseBody);

          if (loadingFn) {
            loadingFn(false);
          }
        } else {
          if (
            response.status === 401 ||
            (response.status === 403 && currentTry < MAX_TRIES)
          ) {
            handleRequestWithNewToken(
              () =>
                handleRequest(
                  url,
                  method,
                  body,
                  successFn,
                  failFn,
                  loadingFn,
                  ++currentTry
                ),
              true
            );
          } else if (currentTry < MAX_TRIES) {
            handleRequest(
              url,
              method,
              body,
              successFn,
              failFn,
              loadingFn,
              ++currentTry
            );
          } else {
            console.error(
              (responseBody && responseBody.error) || response.status
            );
            if (failFn) {
              failFn(customErrMsg);
            }
            if (loadingFn) {
              loadingFn(false);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      if (failFn) {
        failFn();
      }
      if (loadingFn) {
        loadingFn(false);
      }
    }
  };

  const tokenRequestQueue = [];
  let isTokenRequestInProgress = false;

  const handleRequestWithNewToken = (callback) => {
    tokenRequestQueue.push(callback);
    processTokenQueue();
  };

  const processTokenQueue = () => {
    if (isTokenRequestInProgress || tokenRequestQueue.length === 0) return;

    isTokenRequestInProgress = true;

    const callback = tokenRequestQueue.shift();

    getToken((idToken) => {
      setIdToken(idToken);
      setAccessToken(idToken);

      callback(); // Await the callback

      isTokenRequestInProgress = false;
      processTokenQueue(); // Move to next in the queue
    });
  };

  return {
    handleRequest,
    handleRequestWithNewToken,
  };
};

export default useHttp;
