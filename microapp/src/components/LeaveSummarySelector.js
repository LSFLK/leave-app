// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Paper,
  Stack,
} from "@mui/material";

import { LEAVE_APP } from "../constants";
import { getLeaveTypeTitle, getLeaveTypes } from "../utils/utils";

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export default function LeaveSummarySelector(props) {
  const { leaveType, handleLeaveType, leaveMap } = props;
  const [totalCount, setTotalCount] = useState(0.0);

  const getTotal = () => {
    var count = 0;
    getLeaveTypes().forEach((leave) => {
      if (leaveMap[leave.type] && leave.isCounted) {
        count += leaveMap[leave.type].count;
      }
    });
    return count;
  };

  const getTotalOfUncounted = () => {
    var count = 0;
    getLeaveTypes().forEach((leave) => {
      if (leaveMap[leave.type] && !leave.isCounted) {
        count += leaveMap[leave.type].count;
      }
    });
    return count;
  };

  useEffect(() => {
    if (leaveMap.total) {
      setTotalCount(leaveMap.total.count || 0);
    }
  }, [leaveMap]);

  useEffect(() => {}, [leaveType]);

  useEffect(() => {}, [props.collapsed]);
  return (
    <>
      <Accordion
        sx={{
          position: "sticky",
          top: 1,
          width: "100%",
          marginTop: 2,
          marginLeft: 1,
          marginRight: 1,
          padding: "0px !important",
        }}
        expanded={props.collapsed}
      >
        <AccordionSummary
          sx={{
            padding: 0,
            "& .MuiAccordionSummary-content": {
              margin: "0px !important",
            },
          }}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Stack
            sx={{ width: "100%" }}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            {props.collapsed && (
              <>
                <Stack
                  sx={{ width: "100%", paddingLeft: 1 }}
                  direction="column"
                  justifyContent="space-between"
                  alignItems="stretch"
                >
                  <Typography variant="h3">{"Total Leave"}</Typography>
                  <Typography>{"(Excludes lieu leave)"}</Typography>
                </Stack>
                <Stack
                  sx={{ width: "100%", paddingRight: 2 }}
                  direction="column"
                  justifyContent="center"
                  alignItems="flex-end"
                >
                  <Typography variant="h2">{totalCount}</Typography>
                  <Typography>{totalCount === 1 ? "Day" : "Days"}</Typography>
                </Stack>
              </>
            )}
            {!props.collapsed && (
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  justifyContent: "left",
                  flexWrap: "wrap",
                  listStyle: "none",
                  p: 0,
                  m: 0,
                }}
                component="ul"
              >
                <ListItem onClick={handleLeaveType("all")} key={"all"}>
                  <Chip
                    size="small"
                    color={"secondary"}
                    variant={leaveType === "all" ? "contained" : "outlined"}
                    clickable
                    label={"All"}
                  />
                </ListItem>
                {getLeaveTypes().map((type) => (
                  <ListItem
                    onClick={handleLeaveType(type.type)}
                    key={type.title}
                  >
                    <Chip
                      icon={type.icon}
                      size="small"
                      color={"secondary"}
                      variant={
                        leaveType === type.type ? "contained" : "outlined"
                      }
                      clickable
                      label={`${getLeaveTypeTitle(type.type)}: ${
                        leaveMap[type.type] ? leaveMap[type.type].count : 0
                      }`}
                    />
                  </ListItem>
                ))}
              </Paper>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            padding: "4px 8px 4px",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              justifyContent: "left",
              flexWrap: "wrap",
              listStyle: "none",
              p: 0,
              m: 0,
            }}
            component="ul"
          >
            <ListItem onClick={handleLeaveType("all")} key={"all"}>
              <Chip
                size="small"
                color={"secondary"}
                variant={leaveType === "all" ? "contained" : "outlined"}
                clickable
                label={"All"}
                sx={{
                    color: leaveType === 'all' ? '#fff' : undefined,
                  }}
              />
            </ListItem>
            {getLeaveTypes()
              .filter((e) => e.isCounted)
              .map((type) => (
                <ListItem onClick={handleLeaveType(type.type)} key={type.title}>
                  <Chip
                    icon={type.icon}
                    size="small"
                    color={"secondary"}
                    variant={leaveType === type.type ? "contained" : "outlined"}
                    clickable
                    label={`${getLeaveTypeTitle(type.type)}: ${
                      leaveMap[type.type] ? leaveMap[type.type].count : 0
                    }`}
                    sx={{
                        color: leaveType === type.type ? '#fff' : undefined,
                      }}
                  />
                </ListItem>
              ))}
          </Paper>
          <Divider />
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              justifyContent: "left",
              flexWrap: "wrap",
              listStyle: "none",
              p: 0,
              m: 0,
            }}
            component="ul"
          >
            {getLeaveTypes()
              .filter((e) => !e.isCounted)
              .map((type) => (
                <ListItem key={type.title}>
                  <Chip
                    onClick={handleLeaveType(type.type)}
                    icon={type.icon}
                    size="small"
                    color={"secondary"}
                    variant={leaveType === type.type ? "contained" : "outlined"}
                    label={`${getLeaveTypeTitle(type.type)}: ${
                      leaveMap[type.type] ? leaveMap[type.type].count : 0
                    }`}
                    sx={{
                        color: leaveType === type.type ? '#fff' : undefined,
                      }}
                  />
                </ListItem>
              ))}
          </Paper>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
