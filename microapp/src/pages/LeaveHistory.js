// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState, useReducer, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";

// material-ui imports
import { KeyboardArrowUp as KeyboardArrowUpIcon } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Container,
  Fab,
  Fade,
  Slide,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Toolbar,
  useScrollTrigger,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { services } from "../config";
import useHttp from "../utils/http";
import Loader from "../components/Loader";
import LeaveHistoryList from "../components/LeaveHistoryList";
import {
  openBasicDialog,
  showSnackbar,
  handleIsLoading,
} from "../store/reducers/feedback";
import LeaveSummarySelector from "../components/LeaveSummarySelector";
import { getAccessToken, getUserName } from "../utils/oauth";
import { isMobile } from "react-device-detect";
import { getStartYear } from "../utils/formatting";
import { annualLeaveLkEmployeeHandler, getEmailFromJWT } from "../utils/utils";
import { showAlert, showConfirmAlert } from "../components/microapp-bridge";

const headCells = [
  {
    id: "num_days",
    numeric: true,
    disablePadding: false,
    label: "Number of days",
  },
  {
    id: "start_date",
    numeric: true,
    disablePadding: false,
    label: "Start Date",
  },
  { id: "end_date", numeric: true, disablePadding: false, label: "End Date" },
  {
    id: "created_date",
    numeric: true,
    disablePadding: false,
    label: "Submitted Date",
  },
];

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 60,
    target: undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function ShowOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 60,
    target: undefined,
  });

  return (
    <Slide appear={true} direction="down" in={trigger}>
      {children}
    </Slide>
  );
}

const visuallyHiddenSx = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  top: 20,
  width: 1,
};

const StyledTableCell = styled((props) => <TableCell {...props} />)(
  ({ theme }) => ({
    head: {
      backgroundColor: "#aaa",
      color: theme.palette.common.white,
    },
    body: {
      fontSize: 14,
    },
  })
);

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <StyledTableCell
            key={headCell.id}
            align={"center"}
            padding={headCell.disablePadding ? "none" : "default"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span sx={visuallyHiddenSx}>
                  {/* <ArrowUpwardIcon /> */}
                  {/* {order === 'desc' ? 'sorted descending' : 'sorted ascending'} */}
                </span>
              ) : null}
            </TableSortLabel>
          </StyledTableCell>
        ))}
        <StyledTableCell align="right"></StyledTableCell>
      </TableRow>
    </TableHead>
  );
}

function ScrollTop(props) {
  const { children } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    target: undefined,
    disableHysteresis: true,
    threshold: 20,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      "#back-to-top-anchor"
    );

    if (anchor) {
      anchor.scrollIntoView({
        block: "center",
      });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: "fixed", bottom: 70, right: 16 }}
      >
        {children}
      </Box>
    </Fade>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const ACTIONS = {
  SET_SUMMARY: "SET_SUMMARY",
  SET_SUMMARY_MAP: "SET_SUMMARY_MAP",
  SET_SUMMARY_AND_MAP: "SET_SUMMARY_AND_MAP",
  SET_ORDER: "SET_ORDER",
  SET_SHOW_TYPE: "SET_SHOW_TYPE",
  SET_SELECTED_YEAR: "SET_SELECTED_YEAR",
  SET_DELETE_DIALOG: "SET_DELETE_DIALOG",
  HANDLE_SUCCESS: "HANDLE_SUCCESS",
  SET_ERROR_DIALOG: "SET_ERROR_DIALOG",
  HANDLE_RESET: "HANDLE_RESET",
};

const leaveReducer = (curLeaveState, action) => {
  switch (action.type) {
    case ACTIONS.SET_SUMMARY:
      return {
        ...curLeaveState,
        summary: action.summary,
        summaryMap: action.summaryMap
          ? action.summaryMap
          : curLeaveState.summaryMap,
      };
    case ACTIONS.SET_SUMMARY_MAP:
      return { ...curLeaveState, summaryMap: action.summaryMap };
    case ACTIONS.SET_SUMMARY_AND_MAP:
      return {
        ...curLeaveState,
        summary: action.summary,
        summaryMap: action.summaryMap,
      };
    case ACTIONS.SET_ORDER:
      return { ...curLeaveState, order: action.order, orderBy: action.orderBy };
    case ACTIONS.SET_SHOW_TYPE:
      return { ...curLeaveState, showType: action.showType };
    case ACTIONS.SET_SELECTED_YEAR:
      return { ...curLeaveState, selectedYear: action.selectedYear };
    case ACTIONS.SET_DELETE_DIALOG:
      return { ...curLeaveState, deleteDialog: action.deleteDialog };
    case ACTIONS.HANDLE_SUCCESS:
      return { ...curLeaveState, successDialog: action.successDialog };
    case ACTIONS.SET_ERROR_DIALOG:
      return { ...curLeaveState, errorDialog: action.errorDialog };
    case ACTIONS.HANDLE_RESET:
      return {
        ...curLeaveState,
        summary: [],
        summaryMap: {},
        selectedYear: "2021",
        order: "asc",
        orderBy: "submitted_date",
        showType: "total",
        deleteDialog: null,
      };
    default:
      throw new Error("Should not get here");
  }
};

export default function LeaveHistory(props) {
  const [value, setValue] = useState(0);
  const [leaveType, setLeaveType] = useState("all");
  const dispatch = useDispatch();

  const targetRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const trigger = useScrollTrigger({
    target: undefined,
  });

  const handleLeaveType = (selection) => (event) => {
    event.currentTarget.blur();
    setLeaveType(selection);
  };

  useEffect(() => {
    if (targetRef.current) {
      setDimensions({
        width: targetRef.current.offsetWidth,
        height: targetRef.current.offsetHeight,
      });
    }
  }, [trigger]);

  const [isLoading, setIsLoading] = useState(false);
  const { handleRequest, handleRequestWithNewToken } = useHttp();
  const [{ summary, summaryMap }, dispatchLeave] = useReducer(leaveReducer, {
    summary: [],
    summaryMap: {},
    selectedYear: "",
    order: "asc",
    orderBy: "submitted_date",
    showType: "total",
    deleteDialog: null,
    successDialog: {},
  });

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

  const handleLeaveDelete = (id) => {
    const successFn = (data) => {
      handleSnackbar("Successfully cancelled leave!");
      loadSummary();
      handleBasicDialog(false);
    };

    const errorFunc = (error) => {
      handleBasicDialog(false);
    };

    const loadingFunc = (isLoading) => {
      dispatch(handleIsLoading({ isLoading: isLoading }));
      setIsLoading(isLoading);
    };

    // handleBasicDialog(
    //   true,
    //   "Are you sure you want to cancel this leave?",
    //   () => {
    //     handleRequestWithNewToken(() => {
    //       handleRequest(
    //         `${services.CANCEL_LEAVE}/${id}`,
    //         "DELETE",
    //         null,
    //         successFn,
    //         errorFunc,
    //         loadingFunc
    //       );
    //     });
    //   }
    // );
    showConfirmAlert(
      "Cancel Confirmation",
      "Are you sure you want to cancel this leave?",
      "Confirm",
      "Cancel",
      () => {
        handleRequestWithNewToken(() => {
          handleRequest(
            `${services.CANCEL_LEAVE}/${id}`,
            "DELETE",
            null,
            successFn,
            errorFunc,
            loadingFunc
          );
        });
      },
      () => {}
    );
  };

  const loadSummary = () => {
    setIsLoading(true);

    const accessToken = getAccessToken();
    const email = accessToken ? getEmailFromJWT(accessToken) : "";

    handleRequestWithNewToken(() => {
      handleRequest(
        `${
          services.LIST_LEAVE
        }?isActive=true&email=${email}&startDate=${getStartYear()}`,
        "GET",
        null,
        (data) => {
          if (data) {
            var summaryMap = {};
            var summary = [];
            if (data.stats && props.leaveMap) {
              var summaryArray = data.stats.slice();
              summaryMap = JSON.parse(JSON.stringify(props.leaveMap));
              summaryArray.forEach((stat) => {
                let statElement = annualLeaveLkEmployeeHandler(stat);
                if (summaryMap[statElement.type]) {
                  summaryMap[statElement.type]["count"] = statElement.count;
                } else {
                  summaryMap[statElement.type] = {};
                  summaryMap[statElement.type]["count"] = statElement.count;
                }
                if (summaryMap["all"]) {
                  summaryMap["all"]["count"] = statElement.count;
                } else {
                  summaryMap["all"] = {};
                  summaryMap["all"]["count"] = statElement.count;
                }
              });
            }
            if (data.leaves) {
              summary = data.leaves.slice();
              summary.forEach((leave) => {
                let leaveElement = annualLeaveLkEmployeeHandler(leave);
                if (summaryMap[leaveElement.leaveType]) {
                  if (!summaryMap[leaveElement.leaveType]["list"]) {
                    summaryMap[leaveElement.leaveType]["list"] = [];
                  }
                  summaryMap[leaveElement.leaveType]["list"] =
                    summaryMap[leaveElement.leaveType]["list"].concat(
                      leaveElement
                    );
                } else {
                  summaryMap[leaveElement.leaveType] = {};
                  summaryMap[leaveElement.leaveType]["list"] = [leaveElement];
                }
                if (summaryMap["all"]) {
                  if (!summaryMap["all"]["list"]) {
                    summaryMap["all"]["list"] = [];
                  }
                  summaryMap["all"]["list"] =
                    summaryMap["all"]["list"].concat(leaveElement);
                } else {
                  summaryMap["all"] = {};
                  summaryMap["all"]["list"] = [leaveElement];
                }
              });
            }
            dispatchLeave({
              type: ACTIONS.SET_SUMMARY_AND_MAP,
              summary: summary,
              summaryMap: summaryMap,
            });
          }
        },
        () => {},
        (isLoading) => {
          setIsLoading(isLoading);
        }
      );
    });
  };

  useEffect(() => {}, [props.leaveMap, props.leaveYears]);

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <>
      {isLoading && <Loader />}
      {isMobile ? (
        <span>
          <HideOnScroll {...props}>
            <AppBar
              sx={{
                backgroundColor: "transparent",
                width: "100%",
                paddingLeft: 0,
                paddingRight: 0,
              }}
              ref={targetRef}
            >
              <Toolbar
                sx={{
                  paddingLeft: 0,
                  paddingRight: 0,
                  paddingBottom: 0,
                  width: "100%",
                }}
              >
                <LeaveSummarySelector
                  leaveType={leaveType}
                  handleLeaveType={handleLeaveType}
                  leaveMap={summaryMap}
                  collapsed={true}
                />
              </Toolbar>
            </AppBar>
          </HideOnScroll>
          <ShowOnScroll>
            <AppBar
              elevation={0}
              sx={{
                backgroundColor: "transparent",
                width: "100%",
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              <Toolbar
                sx={{
                  paddingLeft: 0,
                  paddingRight: 0,
                  paddingBottom: 0,
                  width: "100%",
                }}
              >
                <LeaveSummarySelector
                  leaveType={leaveType}
                  handleLeaveType={handleLeaveType}
                  leaveMap={summaryMap}
                  collapsed={false}
                />
              </Toolbar>
            </AppBar>
          </ShowOnScroll>
        </span>
      ) : (
        <LeaveSummarySelector
          leaveType={leaveType}
          handleLeaveType={handleLeaveType}
          leaveMap={summaryMap}
          collapsed={true}
        />
      )}
      <Container sx={{ overflow: "hidden", padding: 0 }}>
        <Box sx={{ my: 2 }}>
          <Box id="back-to-top-anchor" sx={{ height: dimensions.height }}></Box>
          <LeaveHistoryList
            leaveMap={summaryMap}
            leaveType={leaveType}
            leaves={
              summaryMap["all"] && summaryMap["all"].list
                ? summaryMap["all"].list
                : []
            }
            isLoading={isLoading}
            onDelete={handleLeaveDelete}
          />
        </Box>
      </Container>
      <ScrollTop {...props}>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </>
  );
}
