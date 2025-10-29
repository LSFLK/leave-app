import React, { useEffect, useState, useCallback } from "react";
import { Route } from "react-router-dom";
import Routes from "./routes";
import ScrollTop from "./components/ScrollTop";
import "./App.css";
import { APPLICATION_CONFIG, OAUTH_CONFIG } from "./config";
import { AuthProvider, Hooks, useAuthContext } from "@asgardeo/auth-react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  ThemeProvider,
  Typography,
} from "@mui/material";
import {
  getNewTokens,
  getUserRoles,
  refreshToken,
  setIdToken,
  setRefreshTokenFunction,
  setSessionClearFunction,
} from "./components/webapp-bridge";
import {
  setAccessToken,
  setLogoutFunction,
  setUserName,
  setUserRoles,
  checkIfRolesExist,
  getIsAdmin,
} from "./utils/oauth";
import { createTheme } from "./themes";
import ConfirmationDialog from "./components/feedback/Dialog";
import { useDispatch, useSelector } from "react-redux";
import { setIsAdmin } from "./store/reducers/menu";

const APP_NAME = "WSO2 Leave App";

const WebApp = () => {
  const {
    state,
    signIn,
    signOut,
    getBasicUserInfo,
    getIDToken,
    getDecodedIDToken,
    refreshAccessToken,
    getAccessToken,
    revokeAccessToken,
    on,
  } = useAuthContext();
  const dispatch = useDispatch();

  const [derivedAuthenticationState, setDerivedAuthenticationState] =
    useState(null);
  const [hasAuthenticationErrors, setHasAuthenticationErrors] = useState(false);
  const [hasLogoutFailureError, setHasLogoutFailureError] = useState();
  const [loadApp, setLoadApp] = useState(false);
  const [authenticateState, setAuthenticateState] = useState(null);
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const history = useLocation();

  const getIsLoggedOut = () => {
    if (sessionStorage.getItem("isLoggedOut") === "true") {
      return true;
    } else {
      return false;
    }
  };

  const [loggedOutState, setLoggedOutState] = useState(getIsLoggedOut());

  const setIsLoggedOut = (value) => {
    sessionStorage.setItem("isLoggedOut", value);

    setLoggedOutState(value === "true");
  };

  const search = useLocation().search;
  const stateParam = new URLSearchParams(search).get("state");
  const errorDescParam = new URLSearchParams(search).get("error_description");

  const setIsInitLogin = (value) => {
    sessionStorage.setItem("isInitLogin", value);
  };

  const getIsInitLogin = () => {
    if (sessionStorage.getItem("isInitLogin") === "true") {
      return true;
    } else {
      return false;
    }
  };

  // const setPathNameToRedirect = () => {
  //   if (!sessionStorage.getItem('pathNameToRedirect') && history && history.location && history.location.pathname) {
  //     if (validatePathName(history.location.pathname)) {
  //       sessionStorage.setItem('pathNameToRedirect', history.location.pathname);
  //     }
  //   }
  // }

  const setIsSessionTimeOut = (value) => {
    sessionStorage.setItem("isSessionTimeOut", value);
  };

  const sessionClearFn = () => {
    setLoadApp(false);
    setIsInitLogin("false");
    setIsSessionTimeOut("true");
    setIsLoggedOut("true");
  };

  const handleTokenRefresh = () => {
    return refreshAccessToken()
      .then(async (e) => {
        const idToken = await getIDToken();
        return idToken;
      })
      .catch((err) => {
        if (err) {
          signOut();
          throw err;
        }
      });
  };

  useEffect(() => {
    if (
      !getIsLoggedOut() &&
      !(state && (state.isLoading || state.isAuthenticated))
    ) {
      handleLogin();
    }
  }, [state.isLoading, state.isAuthenticated]);

  useEffect(() => {
    if (state && state.isAuthenticated) {
      setRefreshTokenFunction(handleTokenRefresh);
      setSessionClearFunction(sessionClearFn);

      const getUserData = async (callback) => {
        const basicUserInfo = await getBasicUserInfo();
        const idToken = await getIDToken();
        const accessToken = await getAccessToken();
        const decodedIDToken = await getDecodedIDToken();

        const authState = {
          authenticateResponse: basicUserInfo,
          idToken: idToken.split("."),
          decodedIdTokenHeader: JSON.parse(atob(idToken.split(".")[0])),
          decodedIDTokenPayload: decodedIDToken,
        };

        setIdToken(idToken);
        setAccessToken(accessToken);

        if (idToken) {
          // TODO
          // getNewTokens(() => {
          refreshToken();
          if (callback) {
            callback();
          }
          // }).catch((e) => {
          //   console.error(e);
          //   // setMessageBar("An error occurred while logging in. Please retry. If the issue continues, please contact Internal Apps Team", true, 'error');
          //   sessionClearFn();
          // });
          if (basicUserInfo && basicUserInfo.email) {
            setUserName(basicUserInfo.email);
          }
          if (basicUserInfo && basicUserInfo.groups) {
            setUserRoles(basicUserInfo.groups);
            dispatch(
              setIsAdmin({
                isAdmin: checkIfRolesExist(
                  OAUTH_CONFIG.ADMIN_ROLES,
                  basicUserInfo.groups
                ),
              })
            );
          }
          setLoadApp(true);
        }

        setAuthenticateState(authState);
      };

      getUserData(() => {
        // initUserPrivileges(redirectToPathName()); TODO
      });
    }
  }, [state.isAuthenticated, state.isLoading]);

  const getPathNameToRedirect = () => {
    return sessionStorage.getItem("pathNameToRedirect");
  };

  const redirectToPathName = () => {
    const pathNameToRedirect = getPathNameToRedirect();

    if (pathNameToRedirect != "null" && pathNameToRedirect) {
      sessionStorage.removeItem("pathNameToRedirect");
      history.push(pathNameToRedirect);
    }
  };

  // const initUserPrivileges = useCallback(async (callbackFn) => {
  //   const endPointUrl = AppConfig.baseUrl + AppConfig.getUserPrivileges;

  //   handleRequest(endPointUrl, 'GET', null, (privileges) => {
  //     let userPrivileges = [];

  //     privileges.forEach(privilege => {
  //       userPrivileges.push(privilege.id);
  //     });

  //     setUserPrivileges(userPrivileges);

  //     setIsUserPrivileged(userPrivileges.length > 0);

  //     if (userPrivileges.length === 0) {
  //       // setMessageBar("You are not privileged to view this app", true, 'error');  TODO
  //     } else if (callbackFn) {
  //       callbackFn();
  //     }
  //   }, () => {
  //     // setMessageBar("An error occurred in initializing the app! Try reloading the page. Please contact the Internal Apps Team if this issue continues.", true, 'error'); TODO
  //   }, setIsAppInitializing)
  // }, []);

  useEffect(() => {
    if (stateParam && errorDescParam) {
      if (errorDescParam === "End User denied the logout request") {
        setHasLogoutFailureError(true);
      }
    }
  }, [stateParam, errorDescParam]);

  const handleLogin = useCallback(() => {
    setHasLogoutFailureError(false);
    signIn().catch(() => setHasAuthenticationErrors(true));
  }, [signIn]);

  const getIsSessionTimeOut = () => {
    if (sessionStorage.getItem("isSessionTimeOut") === "true") {
      return true;
    } else {
      return false;
    }
  };

  const handleLogout = () => {
    signOut();
  };

  /**
   * handles the error occurs when the logout consent page is enabled
   * and the user clicks 'NO' at the logout consent page
   */
  useEffect(() => {
    on(Hooks.SignOut, () => {
      setHasLogoutFailureError(false);
    });

    on(Hooks.SignOutFailed, () => {
      if (!errorDescParam) {
        handleLogin();
      }
    });
    setLogoutFunction(handleLogout);
  }, [on, handleLogin, handleLogout, errorDescParam]);

  // If `clientID` is not defined in `config.json`, show a UI warning.
  // if (!APPLICATION_CONFIG.authConfig?.clientID) {

  //   return (
  //     <div className="content">
  //       <h2>You need to update the Client ID to proceed.</h2>
  //       <p>Please open &quot;src/config.json&quot; file using an editor, and update
  //         the <code>clientID</code> value with the registered application&apos;s client ID.</p>
  //       <p>Visit repo <a
  //         href="https://github.com/asgardeo/asgardeo-auth-react-sdk/tree/master/samples/asgardeo-react-app">README</a> for
  //         more details.</p>
  //     </div>
  //   );
  // }

  // if (hasLogoutFailureError) {
  //   return (
  //     <LogoutRequestDenied
  //       errorMessage={USER_DENIED_LOGOUT}
  //       handleLogin={handleLogin}
  //       handleLogout={handleLogout}
  //     />
  //   );
  // }
  return (
    <>
      {state.isAuthenticated && loadApp ? (
        <ScrollTop>
          <Routes />
        </ScrollTop>
      ) : getIsLoggedOut() ? (
        <Box
          sx={{
            backgroundColor: "background.default",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <Container maxWidth="md">
            <Card>
              <CardContent>
                <Box
                  sx={{
                    p: 2,
                  }}
                >
                  <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    spacing={2}
                  >
                    <Grid item xs={12}>
                      <img
                        alt="logo"
                        width="150"
                        height="auto"
                        src="https://wso2.cachefly.net/wso2/sites/images/brand/downloads/wso2-logo.png"
                      ></img>
                    </Grid>
                    <Grid item xs={12} sx={{ pb: 2 }}>
                      <Typography variant="h3">{APP_NAME}</Typography>
                    </Grid>
                    {!(
                      getIsInitLogin() ||
                      state.isLoading ||
                      state.isAuthenticated
                    ) || getIsSessionTimeOut() ? (
                      <Grid item xs={12}>
                        <Button
                          id="login"
                          onClick={() => {
                            handleLogin();
                          }}
                          variant="contained"
                          color="secondary"
                          disabled={
                            (getIsInitLogin() ||
                              state.isLoading ||
                              state.isAuthenticated) &&
                            !getIsSessionTimeOut()
                          }
                        >
                          Log In
                        </Button>
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="caption">
                          <CircularProgress />
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CardContent>
              <Divider />
            </Card>
          </Container>
        </Box>
      ) : (
        <Box
          sx={{
            backgroundColor: "background.default",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <Container maxWidth="md">
            <Card>
              <CardContent>
                <Box
                  sx={{
                    p: 2,
                  }}
                >
                  <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    spacing={2}
                  >
                    <Grid item xs={12}>
                      <img
                        alt="logo"
                        width="150"
                        height="auto"
                        src="https://wso2.cachefly.net/wso2/sites/images/brand/downloads/wso2-logo.png"
                      ></img>
                    </Grid>
                    <Grid item xs={12} sx={{ pb: 2 }}>
                      <Typography variant="h3">{APP_NAME}</Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption">
                        <CircularProgress />
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
              <Divider />
            </Card>
          </Container>
        </Box>
      )}
    </>
  );
};

const MicroApp = () => {
  return (
    <>
      <ScrollTop>
        <Routes />
      </ScrollTop>
    </>
  );
};

const App = () => {
  const { isLoading, openBasicDialog, basicDialogInfo, basicDialogCallbackFn } =
    useSelector((state) => state.feedback);
  const theme = createTheme();

  useEffect(() => {}, [isLoading, openBasicDialog]);
  return (
    <ThemeProvider theme={theme}>
      <MicroApp />
    </ThemeProvider>
  );
};

export default App;
