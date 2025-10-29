// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState, useEffect, useReducer, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";

// material-ui imports
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Button,
  Box,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  useMediaQuery,
  Stack,
  IconButton,
} from "@mui/material";
import { green } from "@mui/material/colors";
import {
  Done as DoneIcon,
  EmojiFoodBeverageOutlined as EmojiFoodBeverageOutlinedIcon,
  FastfoodOutlined as FastfoodOutlinedIcon,
  WbSunnyOutlined as WbSunnyOutlinedIcon,
} from "@mui/icons-material";

import useHttp from "../utils/http";
import {
  countDaysInRange,
  getDateFromDateString,
  getCurrentYear,
} from "../utils/formatting";
import { setEmployeeData, setIsLead } from "../store/reducers/menu";
import {
  openBasicDialog,
  showSnackbar,
  handleIsLoading,
} from "../store/reducers/feedback";
import { LEAVE_APP } from "../constants";
import { FETCH_EMPLOYEE_AUTHORIZATION_HEADER, services } from "../config";
import NotifyPeople from "../components/NotifyPeople";
import DateRangePicker from "../components/DateRangePicker";
import LeaveHistory from "./LeaveHistory";
import Loader from "../components/Loader";

import { showAlert, showConfirmAlert } from "../components/microapp-bridge";
import { setCountry, getCountry } from "../utils/oauth";
import { getLeaveTypeTitle, getLeaveTypes } from "../utils/utils";
import LeadReport from "./LeadReport";
import LeaveReport from "./LeaveReport";

const ACTIONS = {
  INTIALISE_FORM: "INTIALISE_FORM",
  SET_LEAVE_MAP: "SET_LEAVE_MAP",
  LEAVE_TYPE: "LEAVE_TYPE",
  FULL_DAY_LEAVE: "FULL_DAY_LEAVE",
  IS_MORNING_LEAVE: "IS_MORNING_LEAVE",
  SET_SEARCH_EMAIL: "SET_SEARCH_EMAIL",
  SET_DEFAULT_RECIPIENTS: "SET_DEFAULT_RECIPIENTS",
  SET_EMAIL_RECIPIENTS: "SET_EMAIL_RECIPIENTS",
  SET_LEAVE_YEARS: "SET_LEAVE_YEARS",
  SET_COMMENT: "SET_COMMENT",
  SET_PUBLIC_COMMENT: "SET_PUBLIC_COMMENT",
  HANDLE_RESET: "HANDLE_RESET",
};

//function to remove duplicates from array of recipients
const removeDuplicateRecipients = (recipients) => {
  var tempMap = {};
  recipients.forEach((recipient) => {
    tempMap[recipient.workEmail] = recipient;
  });
  return Object.values(tempMap);
};

const leaveReducer = (curLeaveState, action) => {
  switch (action.type) {
    case ACTIONS.SET_LEAVE_MAP:
      return { ...curLeaveState, leaveMap: action.leaveMap };
    case ACTIONS.INTIALISE_FORM:
      return { ...curLeaveState, leaveMap: action.leaveMap };
    case ACTIONS.LEAVE_TYPE:
      return { ...curLeaveState, leaveType: action.leaveType };
    case ACTIONS.FULL_DAY_LEAVE:
      return {
        ...curLeaveState,
        isFullDayLeave: action.isFullDayLeave,
        isMorningLeave: true,
      };
    case ACTIONS.IS_MORNING_LEAVE:
      return {
        ...curLeaveState,
        isMorningLeave: action.isMorningLeave,
        isFullDayLeave: false,
      };
    case ACTIONS.SET_SEARCH_EMAIL:
      return { ...curLeaveState, searchEmail: action.searchEmail };
    case ACTIONS.SET_DEFAULT_RECIPIENTS:
      return { ...curLeaveState, defaultRecipients: action.defaultRecipients };
    case ACTIONS.SET_EMAIL_RECIPIENTS:
      return {
        ...curLeaveState,
        emailRecipients: removeDuplicateRecipients(action.emailRecipients),
        validationAddPeople: action.validationAddPeople,
        ...(action.savedRecipients && {
          savedRecipients: action.savedRecipients,
        }),
      };
    case ACTIONS.SET_LEAVE_YEARS:
      return { ...curLeaveState, leaveYears: action.leaveYears };
    case ACTIONS.SET_COMMENT:
      return { ...curLeaveState, comment: action.comment };
    case ACTIONS.SET_PUBLIC_COMMENT:
      return { ...curLeaveState, isPublicComment: action.isPublicComment };
    case ACTIONS.HANDLE_RESET:
      return {
        ...curLeaveState,
      };
    default:
      throw new Error("Should not get here");
  }
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`nav-tab-${index}`}
      aria-labelledby={`nav-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const LeaveForm = (props) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { handleRequest, handleRequestWithNewToken } = useHttp();
  const matchedDownMd = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const { isLead, navigatedView } = useSelector((state) => state.menu);
  const [value, setValue] = useState(navigatedView);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [startDate, changeStartDate] = useState(new Date());
  const [endDate, changeEndDate] = useState(new Date());
  const [amountOfDays, setAmountOfDays] = useState(0);
  const [hasOverlap, setHasOverlap] = useState(false);
  const [workingDays, setWorkingDays] = useState(0);
  const [errorForWorkingDays, setErrorForWorkingDays] = useState(false);
  const [
    {
      leaveMap,
      leaveType,
      isFullDayLeave,
      isMorningLeave,
      emailRecipients,
      defaultRecipients,
      savedRecipients,
      emailMap,
      searchEmail,
      validationAddPeople,
      successDialog,
      leaveTypes,
      leaveYears,
      comment,
      isPublicComment,
    },
    dispatchForm,
  ] = useReducer(leaveReducer, {
    leaveMap: {},
    leaveType: "casual",
    isFullDayLeave: true,
    isMorningLeave: true,
    emailRecipients: [],
    defaultRecipients: [],
    savedRecipients: [],
    emailMap: {},
    searchEmail: null,
    validationAddPeople: true,
    successDialog: {},
    leaveTypes: [],
    leaveYears: [],
    comment: "",
    isPublicComment: true,
  });

  const buttonSx = {
    ...(success && {
      bgcolor: green[500],
      "&:hover": {
        bgcolor: green[700],
      },
    }),
  };

  const handleBasicDialog = (isOpen, message, callbackFn) => {
    dispatch(
      openBasicDialog({
        openBasicDialog: isOpen,
        basicDialogMessage: message,
        basicDialogCallbackFn: callbackFn,
      })
    );
  };

  const handleSnackbar = (message) => {
    dispatch(showSnackbar({ snackbarMessage: message }));
  };

  const handlePublicComment = (event) => {
    dispatchForm({
      type: ACTIONS.SET_PUBLIC_COMMENT,
      isPublicComment: event.target.checked,
    });
  };

  const loadForm = () => {
    setIsLoading(true);

    handleRequestWithNewToken(() => {
      handleRequest(
        services.LEAVE_FORM,
        "GET",
        null,
        (data) => {
          var leadEmails = [];
          if (data) {
            if (data.leaveTypes) {
              var tempArray = data.leaveTypes.slice();
              var tempMap = {};
              tempArray.forEach((leaveType) => {
                tempMap[leaveType.key] = {
                  type: leaveType.key,
                  label: leaveType.value,
                  count: 0,
                };
              });
              handleLeaveType(tempArray.length ? tempArray[0].key : null);
              dispatchForm({
                type: ACTIONS.SET_LEAVE_MAP,
                leaveMap: tempMap,
              });
            }
            var defaultRecipients = [];
            if (data.leadEmails) {
              leadEmails = Array.isArray(data.leadEmails)
                ? data.leadEmails.slice()
                : [];
              defaultRecipients = leadEmails.map((email) => {
                return {
                  workEmail: email.trim(),
                };
              });
              dispatchForm({
                type: ACTIONS.SET_DEFAULT_RECIPIENTS,
                defaultRecipients,
              });
            }
            if (data.emailRecipients) {
              const emailRecipients = data.emailRecipients
                .filter((e) => {
                  return (
                    !e.search(emailRegex) >= 0 &&
                    e.length > 2 &&
                    !leadEmails.find((email) => email === e.trim())
                  );
                })
                .map((e) => {
                  return {
                    workEmail: e.trim(),
                  };
                });
              const emailRegex = /^\s*$/g;
              dispatchForm({
                type: ACTIONS.SET_EMAIL_RECIPIENTS,
                emailRecipients: [
                  ...LEAVE_APP.DEFAULT_EMAIL_RECIPIENTS,
                  ...defaultRecipients,
                  ...emailRecipients,
                ],
                savedRecipients: emailRecipients,
                validationAddPeople: true,
              });
            }
            if (data.location) {
              setCountry(data.location);
            }

            if (data.leave_years && data.leave_years.length) {
              dispatchForm({
                type: ACTIONS.SET_LEAVE_YEARS,
                leaveYears: data.leave_years.slice(),
              });
            } else {
              dispatchForm({
                type: ACTIONS.SET_LEAVE_YEARS,
                leaveYears: [getCurrentYear()],
              });
            }
          }
          setIsLoading(false);
        },
        () => {
          showAlert(
            "Error",
            "Error while loading form",
            "Close",
            () => {},
            () => {}
          );
        },
        () => {}
      );
    });
  };

  const handleWorkingDays = (days, hasOverlap) => {
    setWorkingDays(days);
    setHasOverlap(hasOverlap);
  };

  const loadWorkingDays = () => {
    setIsLoadingDates(true);
    const body = {
      periodType:
        amountOfDays > 1 ? "multiple" : isFullDayLeave ? "one" : "half",
      startDate: getDateFromDateString(startDate),
      endDate: getDateFromDateString(endDate),
      isMorningLeave:
        amountOfDays > 1 ? null : isFullDayLeave ? null : isMorningLeave,
    };

    const successFn = (data) => {
      if (data) {
        handleWorkingDays(
          data.workingDays ? data.workingDays : 0,
          data.hasOverlap ? data.hasOverlap : false
        );
        setErrorForWorkingDays(false);
      }
    };

    const errorFunc = (error) => {
      setErrorForWorkingDays(true);
    };

    const loadingFunc = (isLoading) => {
      setIsLoadingDates(isLoading);
    };

    handleRequestWithNewToken(() => {
      handleRequest(
        `${services.CALCULATE_DAYS_OF_LEAVE}`,
        "POST",
        body,
        successFn,
        errorFunc,
        loadingFunc
      );
    });
  };

  const loadEmployeeData = () => {
    const successFn = (data) => {
      if (data) {
        dispatch(setEmployeeData({ employeeData: data }));
      }
    };

    const errorFunc = (error) => {
      // showAlert("Error", "Error while fetching employee data", "Close", () => { }, () => { });
    };

    const loadingFunc = (isLoading) => {
      setIsLoading(isLoading);
    };

    handleRequestWithNewToken(() => {
      handleRequest(
        services.FETCH_EMPLOYEES,
        "GET",
        null,
        successFn,
        errorFunc,
        loadingFunc
      );
    });
  };

  const handleLeaveType = (type) => (event) => {
    dispatchForm({
      type: ACTIONS.LEAVE_TYPE,
      leaveType: type,
    });
  };

  const handleSubmitForm = async () => {
    console.log("hello");

    const successFn = (data) => {
      if (data) {
        setSuccess(true);
      }
      handleSnackbar("Successfully submitted leave!");
      refresh();

      handleBasicDialog(false);
      window.scrollTo(0, 0);
      setIsSubmitted(true);
    };

    const errorFunc = (error) => {
      setSuccess(false);
      showAlert("Error", "Error while submitting leave", "Close");
    };

    const loadingFunc = (isLoading) => {
      setIsSubmitLoading(isLoading);
      dispatch(handleIsLoading({ isLoading: isLoading }));
    };

    // handleBasicDialog(true, "Proceed with leave submission.", () => {
    //   const body = {
    //     leaveType,
    //     periodType:
    //       amountOfDays > 1 ? "multiple" : isFullDayLeave ? "one" : "half",
    //     emailRecipients: emailRecipients.map((email) => email.workEmail),
    //     startDate: getDateFromDateString(startDate),
    //     endDate: getDateFromDateString(endDate),
    //     isMorningLeave:
    //       amountOfDays > 1 ? null : isFullDayLeave ? null : isMorningLeave,
    //     comment,
    //     isPublicComment,
    //   };

    //   handleRequestWithNewToken(async () => {
    //     handleRequest(
    //       services.SUBMIT_LEAVE,
    //       "POST",
    //       body,
    //       successFn,
    //       errorFunc,
    //       loadingFunc
    //     );
    //   });
    // });
    showConfirmAlert(
      "Confirm Submission",
      "Proceed with leave submission.",
      "Confirm",
      "Cancel",
      () => {
        const body = {
          leaveType,
          periodType:
            amountOfDays > 1 ? "multiple" : isFullDayLeave ? "one" : "half",
          emailRecipients: emailRecipients.map((email) => email.workEmail),
          startDate: getDateFromDateString(startDate),
          endDate: getDateFromDateString(endDate),
          isMorningLeave:
            amountOfDays > 1 ? null : isFullDayLeave ? null : isMorningLeave,
          comment,
          isPublicComment,
        };
        console.log(body);

        handleRequest(
          services.SUBMIT_LEAVE,
          "POST",
          body,
          successFn,
          errorFunc,
          loadingFunc
        );
      },
      () => {},
      () => {}
    );
  };

  const handleStartDate = (date) => {
    setIsSubmitted(false);
    getDateFromDateString(date.$d);
    changeStartDate(date.$d);
    let numOfDays = countDaysInRange(date.$d, endDate);
    if (date.$d >= endDate) {
      changeEndDate(date.$d);
      setAmountOfDays(1);
    } else {
      setAmountOfDays(numOfDays);
    }
    if (numOfDays > 1) {
      handleFullDayLeave(true);
    }
  };

  const handleEndDate = (date) => {
    setIsSubmitted(false);
    changeEndDate(date.$d);
    let numOfDays = countDaysInRange(startDate, date.$d);
    setAmountOfDays(numOfDays);
    if (numOfDays > 1) {
      handleFullDayLeave(true);
    }
  };

  // Toggle between half day and full day leave
  const handleFullDayLeave = (event) => {
    setIsSubmitted(false);
    dispatchForm({
      type: ACTIONS.FULL_DAY_LEAVE,
      isFullDayLeave: true,
    });
  };

  // Toggle between morning and afternoon half day leave
  const handleIsMorningLeave = (isMorning) => {
    setIsSubmitted(false);
    dispatchForm({
      type: ACTIONS.IS_MORNING_LEAVE,
      isMorningLeave: isMorning,
    });
  };

  const handleAddRecipient = (emails) => {
    setIsSubmitted(false);
    dispatchForm({
      type: ACTIONS.SET_EMAIL_RECIPIENTS,
      emailRecipients: emails,
      validationAddPeople: true,
    });

    dispatchForm({
      type: ACTIONS.SET_SEARCH_EMAIL,
      searchEmail: null,
      validationAddPeople: true,
    });
  };

  const handleRemoveEmail = (email) => {
    setIsSubmitted(false);
    if (email && email.workEmail) {
      var index = emailRecipients.findIndex((recipient) => {
        return recipient.workEmail === email.workEmail;
      });

      if (index >= 0) {
        var tempArray = emailRecipients.slice();
        tempArray.splice(index, 1);
        // Validation checks whether a selected email is removed
        dispatchForm({
          type: ACTIONS.SET_EMAIL_RECIPIENTS,
          emailRecipients: tempArray,
          validationAddPeople:
            email.workEmail === searchEmail ? true : validationAddPeople,
        });
      }
    }
  };

  const handleEmailPicker = (selectedEmail) => {
    dispatchForm({
      type: ACTIONS.SET_SEARCH_EMAIL,
      searchEmail: selectedEmail,
      validationAddPeople: !findIfAdded(selectedEmail),
    });
  };

  const findIfAdded = (selectedEmail) => {
    if (selectedEmail && selectedEmail.workEmail) {
      var index = emailRecipients.findIndex((recipient) => {
        return recipient.workEmail === selectedEmail.workEmail;
      });
      var indexTwo = defaultRecipients.findIndex((recipient) => {
        return recipient.workEmail === selectedEmail.workEmail;
      });
      if (index < 0 && indexTwo < 0) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };

  const handleComment = (event) => {
    dispatchForm({
      type: ACTIONS.SET_COMMENT,
      comment: event.target.value,
    });
  };

  const refresh = () => {
    loadForm();
    loadEmployeeData();
    setAmountOfDays(countDaysInRange(startDate, endDate));
    loadWorkingDays();

    setSuccess(false);
  };

  useEffect(() => {}, [emailRecipients]);

  useEffect(() => {
    var valueToSet = 0;
    switch (navigatedView) {
      case "form":
        valueToSet = 0;
        break;
      case "history":
        valueToSet = 1;
        break;
      case "leads":
        valueToSet = 2;
        break;
      case "reports":
        valueToSet = 3;
        break;
    }
    setValue(valueToSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigatedView, isLead]);

  useEffect(() => {
    setIsSubmitted(false);

    refresh();
  }, []);

  return (
    <>
      <TabPanel
        value={value}
        index={0}
        sx={{ padding: 2 }}
        dir={theme.direction}
      >
        <Grid
          container
          spacing={2}
          direction="row"
          justifyContent="space-around"
          alignItems="flex-start"
          sx={{ mt: 2 }}
        >
          {isLoading && <Loader />}
          <Grid item xs={12}>
            <Typography variant="h3" display="block">
              New Leave
            </Typography>
          </Grid>
          <Grid item sm={12} md={6}>
            <Grid item xs={12}>
              <Typography sx={{ marginBottom: 2 }} variant="h5" display="block">
                Select Date(s):
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                amountOfDays={amountOfDays}
                workingDays={workingDays}
                handleStartDate={handleStartDate}
                handleEndDate={handleEndDate}
                loadWorkingDays={loadWorkingDays}
                isLoading={isLoadingDates}
                isMorningLeave={isMorningLeave}
                isFullDayLeave={isFullDayLeave}
                errorForWorkingDays={errorForWorkingDays}
                hasOverlap={hasOverlap}
                isSubmitted={isSubmitted}
              />
            </Grid>
          </Grid>
          <Grid item sm={12} md={6}>
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="flex-start"
              spacing={2}
            >
              {/* <span style={{ width: '100%', alignSelf: 'center' }}>
                <Grid item xs={12}>
                  <Typography sx={{ marginBottom: 2 }} variant="h5" display="block">
                    Select Type:
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row"
                    justifyContent="center"
                    alignItems="flex-start"
                    spacing={1}>
                    {getLeaveTypes(true).map((leave, index) => (
                      <Stack
                        sx={{ width: 100 }}
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        spacing={0}>
                        <Avatar sx={{ backgroundColor: leaveType === leave.type && `${theme.palette.secondary.main} !important` }}>
                          <IconButton onClick={handleLeaveType(leave.type)} selected={leaveType === leave.type} disabled={isLoading || !Boolean(getCountry())}>
                            {leave.icon}
                          </IconButton>
                        </Avatar>
                        <Typography textAlign={"center"}>
                          {getLeaveTypeTitle(leave.type)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              </span> */}

              {/* <span style={{ width: '100%', alignSelf: 'center' }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ marginBottom: 2 }} variant="h5" display="block">
                    Select Portion of Day:
                  </Typography>
                </Grid>
                <Stack direction="row"
                  justifyContent="center"
                  alignItems="flex-start" spacing={2}>
                  <Button sx={{
                    width: 120,
                    borderRadius: 4,
                    padding: 1,
                    border: '0.5px solid',
                    // color: isFullDayLeave && '#fff',
                    backgroundColor: isFullDayLeave && `${theme.palette.secondary.main} !important`,
                  }} onClick={handleFullDayLeave} selected={isFullDayLeave} variant="outlined" size="large">
                    Full Day
                  </Button>
                  <Button variant="outlined" size="large"
                    sx={{
                      width: 120,
                      background: `linear-gradient(to right bottom, ${(!isFullDayLeave && isMorningLeave) ? theme.palette.secondary.main : '#fff'} 50%, #fff 50%)`,
                      borderRadius: 4,
                      padding: 1,
                      border: '0.5px solid',
                    }}
                    // sx={{
                    //   borderRadius: 4,
                    //   padding: 2,
                    //   border: '1px solid transparent',
                    //   backgroundColor: (!isFullDayLeave && isMorningLeave) && `${theme.palette.secondary.main} !important`,
                    //   color: (!isFullDayLeave && isMorningLeave) && '#fff',
                    // }} 
                    disabled={amountOfDays > 1
                    } onClick={() => { handleIsMorningLeave(true) }} selected={(!isFullDayLeave && isMorningLeave)}>
                    First Half
                  </Button>
                  <Button variant="outlined" size="large" sx={{
                    width: 120,
                    background: `linear-gradient(to right bottom, #fff 50%, ${(!isFullDayLeave && !isMorningLeave) ? theme.palette.secondary.main : '#fff'} 50%)`,
                    borderRadius: 4,
                    padding: 1,
                    border: '0.5px solid',

                    // borderRadius: 4,
                    // padding: 2,
                    // border: '1px solid transparent',
                    // backgroundColor: (!isFullDayLeave && !isMorningLeave) && `${theme.palette.secondary.main} !important`,
                    // color: (!isFullDayLeave && !isMorningLeave) && '#fff'
                  }} disabled={amountOfDays > 1} onClick={() => { handleIsMorningLeave(false) }} selected={(!isFullDayLeave && !isMorningLeave)}>
                    Second Half
                  </Button>
                </Stack>
              </span> */}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid
            container
            item
            xs={12}
            spacing={1}
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Grid container item xs={12} sm={6}>
              <Grid item xs={12}>
                <Typography variant="h5" display="block">
                  Select Type:
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <List>
                  {getLeaveTypes().map((leave, index) => (
                    <ListItemButton
                      sx={{
                        borderRadius: 2,
                        backgroundColor:
                          leaveType === leave.type &&
                          `${theme.palette.grey[300]} !important`,
                        color:
                          leaveType === leave.type &&
                          `${theme.palette.primary.dark}`,
                      }}
                      onClick={handleLeaveType(leave.type)}
                      selected={leaveType === leave.type}
                    >
                      <ListItemAvatar color="secondary">
                        <Avatar
                          sx={{
                            backgroundColor:
                              leaveType === leave.type &&
                              `${theme.palette.secondary.main} !important`,
                          }}
                        >
                          {leave.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={getLeaveTypeTitle(leave.type)} />
                      {leaveType === leave.type && (
                        <DoneIcon color="secondary" />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Grid>
            </Grid>
            <Grid container item xs={12} sm={6}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h5" display="block">
                  Select Portion of Day:
                </Typography>
              </Grid>
              <Grid
                item
                xs={12}
                direction="column"
                alignItems="center"
                justifyContent="center"
              >
                <List>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      backgroundColor:
                        isFullDayLeave &&
                        `${theme.palette.grey[300]} !important`,
                    }}
                    onClick={handleFullDayLeave}
                    selected={isFullDayLeave}
                  >
                    <ListItemAvatar color="secondary">
                      <Avatar
                        sx={{
                          backgroundColor:
                            isFullDayLeave &&
                            `${theme.palette.secondary.main} !important`,
                        }}
                      >
                        <WbSunnyOutlinedIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={"Full Day"} />
                    {isFullDayLeave && <DoneIcon color="secondary" />}
                  </ListItemButton>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      backgroundColor:
                        !isFullDayLeave &&
                        isMorningLeave &&
                        `${theme.palette.grey[300]} !important`,
                    }}
                    disabled={amountOfDays > 1}
                    onClick={() => {
                      handleIsMorningLeave(true);
                    }}
                    selected={!isFullDayLeave && isMorningLeave}
                  >
                    <ListItemAvatar color="secondary">
                      <Avatar
                        sx={{
                          backgroundColor:
                            !isFullDayLeave &&
                            isMorningLeave &&
                            `${theme.palette.secondary.main} !important`,
                        }}
                      >
                        <EmojiFoodBeverageOutlinedIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={"First Half"}
                      // secondary={secondary ? 'Secondary text' : null}
                    />
                    {!isFullDayLeave && isMorningLeave && (
                      <DoneIcon color="secondary" />
                    )}
                  </ListItemButton>
                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      backgroundColor:
                        !isFullDayLeave &&
                        !isMorningLeave &&
                        `${theme.palette.grey[300]} !important`,
                      // color: (!isFullDayLeave && !isMorningLeave) && theme.palette.primary.light
                    }}
                    disabled={amountOfDays > 1}
                    onClick={() => {
                      handleIsMorningLeave(false);
                    }}
                    selected={!isFullDayLeave && !isMorningLeave}
                  >
                    <ListItemAvatar color="secondary">
                      <Avatar
                        sx={{
                          backgroundColor:
                            !isFullDayLeave &&
                            !isMorningLeave &&
                            `${theme.palette.secondary.main} !important`,
                        }}
                      >
                        <FastfoodOutlinedIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={"Second Half"}
                      // secondary={secondary ? 'Secondary text' : null}
                    />
                    {!isFullDayLeave && !isMorningLeave && (
                      <DoneIcon color="secondary" />
                    )}
                  </ListItemButton>
                </List>
              </Grid>
            </Grid>
          </Grid>
          <Grid container item xs={12}>
            <Grid item xs={12}>
              <Typography variant="h5" display="block">
                Select People/Groups to Notify:
              </Typography>
            </Grid>
            <Grid item xs={12} mt={1}>
              <NotifyPeople
                isLoading={isLoading}
                defaultRecipients={defaultRecipients}
                emailRecipients={emailRecipients}
                savedRecipients={savedRecipients}
                handleAddRecipient={handleAddRecipient}
                handleRemoveEmail={handleRemoveEmail}
                handleEmailPicker={handleEmailPicker}
                handleComment={handleComment}
                handlePublicComment={handlePublicComment}
                comment={comment}
                isPublicComment={isPublicComment}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ position: "relative", width: "100%" }}>
              <Button
                fullWidth={matchedDownMd}
                variant="contained"
                sx={buttonSx}
                disabled={
                  isLoading ||
                  isLoadingDates ||
                  isSubmitLoading ||
                  hasOverlap ||
                  errorForWorkingDays ||
                  workingDays <= 0
                }
                color="secondary"
                onClick={!success && handleSubmitForm}
                endIcon={success && <DoneIcon />}
              >
                {success ? "Submitted" : "Submit"}
              </Button>
              {isSubmitLoading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: theme.palette.secondary.main,
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
      <TabPanel value={value} index={1} dir={theme.direction}>
        <LeaveHistory leaveMap={leaveMap} leaveYears={leaveYears} />
      </TabPanel>
      <TabPanel value={value} index={2} dir={theme.direction}>
        <LeadReport leaveMap={leaveMap} leaveYears={leaveYears} />
      </TabPanel>
      <TabPanel value={value} index={3} dir={theme.direction}>
        <LeaveReport leaveMap={leaveMap} leaveYears={leaveYears} />
      </TabPanel>
    </>
  );
};

export default LeaveForm;
