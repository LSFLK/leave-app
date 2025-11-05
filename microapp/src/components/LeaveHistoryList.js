// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import CalendarIcon from "./@extended/CalendarIcon";
import {
  ClearOutlined as ClearOutlinedIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import EmptyListText from "./EmptyListText";
import { getLocalDisplayDateReadable } from "../utils/formatting";
import { LEAVE_APP } from "../constants";
import { getLeaveTypeTitle } from "../utils/utils";

export default function LeaveHistoryList(props) {
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const { leaves, leaveType, leaveMap, isLoading } = props;

  useEffect(() => {
    if (leaveType === "all") {
      setFilteredLeaves(leaves);
    } else {
      setFilteredLeaves(
        leaves ? leaves.filter((e) => e.leaveType === leaveType) : []
      );
    }
  }, [leaves, leaveType]);

  useEffect(() => {}, [leaves, isLoading]);

  return (
    <>
      {filteredLeaves.length ? (
        filteredLeaves.map((leave, index) => (
          <Accordion key={uuidv4()}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Card sx={{ width: "100%" }} elevation={0}>
                <CardContent
                  sx={{
                    padding: 0,
                    paddingLeft: 1,
                    paddingBottom: "0px !important",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 14 }}
                    color="text.secondary"
                    gutterBottom
                  >
                    {`${getLeaveTypeTitle(leave.leaveType)}`}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="stretch"
                    spacing={2}
                  >
                    <CalendarIcon date={leave.startDate} />
                    <Stack
                      direction="column"
                      justifyContent="flex-start"
                      alignItems="stretch"
                      spacing={2}
                    >
                      <Typography variant="h5" component="div">
                        {leave.numberOfDays > 1
                          ? `From ${getLocalDisplayDateReadable(
                              leave.startDate
                            )} to ${getLocalDisplayDateReadable(leave.endDate)}`
                          : `On ${getLocalDisplayDateReadable(
                              leave.startDate
                            )} ${
                              leave.numberOfDays === 0.5
                                ? leave.isMorningLeave
                                  ? "(First half)"
                                  : "(Second half)"
                                : ""
                            }`}
                      </Typography>
                      <Typography color="text.secondary">
                        {`${leave.numberOfDays || "N/A"} ${
                          leave.numberOfDays === 1 ? "day" : "days"
                        }`}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </AccordionSummary>
            <AccordionDetails
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Stack
                direction="column"
                justifyContent="space-between"
                alignItems="flex-end"
                spacing={1}
              >
                <Typography sx={{ mt: 1 }} variant="body2">
                  {`Submitted on: ${getLocalDisplayDateReadable(
                    leave.createdDate
                  )}`}
                </Typography>
                <Button
                  onClick={() => props.onDelete(leave.id)}
                  color="error"
                  variant="contained"
                  size="small"
                  disabled={!leave.isCancelAllowed}
                  startIcon={<ClearOutlinedIcon />}
                >
                  Cancel leave
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <EmptyListText text={isLoading ? "Loading..." : "Nothing to show"} />
      )}
    </>
  );
}
