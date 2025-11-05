// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import Stack from "@mui/material/Stack";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  useTheme,
  TextField,
} from "@mui/material";
import {
  countDaysInRange,
  getLocalDisplayDateReadable,
} from "../utils/formatting";

import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WorkIcon from "@mui/icons-material/Work";

function ResponsiveDialog(props) {
  var { open, type, handleClose, startDate, endDate } = props;

  const getMinDate = () => {
    const today = new Date();
    switch (type) {
      case "From":
        return new Date(today.getFullYear(), today.getMonth() - 1, 1);
      case "To":
        return startDate;
      default:
        return null;
    }
  };

  const getDate = () => {
    switch (type) {
      case "From":
        return startDate;
      case "To":
        return endDate;
      default:
        return null;
    }
  };

  const handleOnChange = (date) => {
    switch (type) {
      case "From":
        props.handleStartDate(date);
        break;
      case "To":
        props.handleEndDate(date);
        break;
      default:
        break;
    }
    handleClose();
  };

  useEffect(() => {}, [open, type, startDate]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Typography variant="h5">{type}</Typography>
        {handleClose ? (
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={dayjs(getDate())}
            onChange={handleOnChange}
            minDate={dayjs(getMinDate())}
          />
        </LocalizationProvider>
      </DialogContent>
    </Dialog>
  );
}

export default function ResponsiveDatePickers(props) {
  const {
    startDate,
    endDate,
    isLoading,
    errorForWorkingDays,
    workingDays,
    amountOfDays,
    isFullDayLeave,
    isMorningLeave,
    hasOverlap,
    isSubmitted,
  } = props;
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState("");

  const getSelectedDays = () => {
    var selectedDays = countDaysInRange(props.startDate, props.endDate);
    if (selectedDays === 1 && !props.isFullDayLeave) {
      selectedDays = 0.5;
    }
    return selectedDays;
  };

  const handleOpenDialog = (type) => () => {
    setOpenDialog(type);
  };

  const handleCloseDialog = () => {
    setOpenDialog("");
  };

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return; // skip the first run
    }

    props.loadWorkingDays();
  }, [startDate, endDate, hasOverlap, isFullDayLeave, isMorningLeave]);
  useEffect(() => {}, [
    isLoading,
    workingDays,
    errorForWorkingDays,
    amountOfDays,
    isSubmitted,
  ]);

  return (
    <>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <Grid item xs={12} md={6}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <TextField
              label="From"
              variant="outlined"
              value={getLocalDisplayDateReadable(startDate)}
              onClick={(e) => {
                e.currentTarget.blur(); // Remove focus to avoid dark border
                handleOpenDialog("From")();
              }}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#CCCCCC",
                    boxShadow: "none",
                  },
                },
              }}
            />
            <TextField
              label="To"
              variant="outlined"
              value={getLocalDisplayDateReadable(endDate)}
              onClick={handleOpenDialog("To")}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: "#CCCCCC",
                    boxShadow: "none",
                  },
                },
              }}
            />
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="column" spacing={1} alignItems="center" mt={1}>
            <Chip
              icon={<CalendarMonthIcon />}
              label={`Total days selected: ${getSelectedDays()}`}
              sx={{ fontSize: 14 }}
            />
            <Chip
              icon={<WorkIcon />}
              label={`Working days selected: ${isLoading ? "-" : workingDays}`}
              sx={{ fontSize: 14 }}
            />
            {isLoading && (
              <CircularProgress color="secondary" size={18} sx={{ mt: 1 }} />
            )}
          </Stack>
        </Grid>
      </Grid>
      <Grid
        item
        container
        spacing={2}
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Grid item xs={6}>
          {!isLoading && (
            <>
              {isSubmitted ? (
                <Alert sx={{ mt: 1 }} variant="filled" severity="success">
                  Your leave request has been submitted!
                </Alert>
              ) : (
                hasOverlap && (
                  <Alert sx={{ mt: 1 }} variant="filled" severity="error">
                    Your leave request overlaps with an existing leave request!
                  </Alert>
                )
              )}
              {props.errorForWorkingDays && (
                <Alert sx={{ mt: 1 }} variant="filled" severity="error">
                  Failed to fetch working days!
                </Alert>
              )}
              {props.workingDays <= 0 && !props.errorForWorkingDays ? (
                <Alert sx={{ mt: 1 }} variant="filled" severity="warning">
                  This leave request doesn't contain any working days!
                </Alert>
              ) : (
                ""
              )}
            </>
          )}
        </Grid>
        {/* </Grid> */}
      </Grid>
      {/* </LocalizationProvider> */}
      <ResponsiveDialog
        open={Boolean(openDialog)}
        type={openDialog}
        startDate={startDate}
        endDate={endDate}
        handleStartDate={props.handleStartDate}
        handleEndDate={props.handleEndDate}
        handleClose={handleCloseDialog}
        theme={theme}
      />
    </>
  );
}
