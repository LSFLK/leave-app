import React, { useEffect, useReducer } from "react";
import { Box, Card, CardContent, Chip, FormControl, FormHelperText, Grid, InputLabel, LinearProgress, MenuItem, OutlinedInput, Select, Stack } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import LoadingButton from '@mui/lab/LoadingButton';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import useHttp from "../utils/http";
import { services } from "../config";

import { getDateFromDateString } from "../utils/formatting";
import CountryPicker from "../components/subcomponents/CountryPicker";
import { LEAVE_APP } from "../constants";
import OverallLeaveReport from "../components/OverallLeaveReport";
import Loader from "../components/Loader";
import { getEndDateOfThisYear, getStartDateOfThisYear } from "../utils/utils";

const ACTIONS = {
    SET_LEAVES: 'SET_LEAVES',
    SET_SUMMARY: 'SET_SUMMARY',
    SET_EMPLOYEE: 'SET_EMPLOYEE',
    SET_IS_LOADING: 'SET_IS_LOADING',
    SET_REPORT_FILTERS: 'SET_REPORT_FILTERS',
    SET_EMPLOYEE_STATUS: 'SET_EMPLOYEE_STATUS',
    SET_BUSINESS_UNIT: 'SET_BUSINESS_UNIT',
    SET_DEPARTMENT: 'SET_DEPARTMENT',
    SET_TEAM: 'SET_TEAM',
    SET_LOCATION: 'SET_LOCATION',
    SET_DATE_RANGE: 'SET_DATE_RANGE',
    HANDLE_RESET: 'HANDLE_RESET'
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const leaveReducer = (curLeaveState, action) => {
    switch (action.type) {
        case ACTIONS.SET_LEAVES:
            return { ...curLeaveState, leaves: action.leaves, leaveMap: action.leaveMap, }
        case ACTIONS.SET_SUMMARY:
            return { ...curLeaveState, summary: action.summary }
        case ACTIONS.SET_EMPLOYEE:
            return { ...curLeaveState, employee: action.employee }
        case ACTIONS.SET_IS_LOADING:
            return { ...curLeaveState, isLoading: action.isLoading }
        case ACTIONS.SET_EMPLOYEE_STATUS:
            return { ...curLeaveState, employeeStatuses: action.employeeStatuses }
        case ACTIONS.SET_BUSINESS_UNIT:
            return { ...curLeaveState, businessUnit: action.value }
        case ACTIONS.SET_DEPARTMENT:
            return { ...curLeaveState, department: action.value }
        case ACTIONS.SET_TEAM:
            return { ...curLeaveState, team: action.value }
        case ACTIONS.SET_LOCATION:
            return { ...curLeaveState, location: action.location }
        case ACTIONS.SET_REPORT_FILTERS:
            return {
                ...curLeaveState, locations: action.locations, businessUnits: action.businessUnits,
                departments: action.departments, teams: action.teams, orgMap: action.orgMap
            }

        case ACTIONS.SET_DATE_RANGE:
            return { ...curLeaveState, ...(action.startDate ? { startDate: action.startDate } : {}), ...(action.endDate ? { endDate: action.endDate } : {}) }
        case ACTIONS.HANDLE_RESET:
            return { ...curLeaveState, employee: null, leaves: [], leaveMap: {}, }
        default:
            throw new Error('Should not get here');
    }
}

const LeaveReportOverall = props => {
    const [{ employee, leaves, leaveMap, isLoading, startDate, endDate, locations, location, businessUnits, businessUnit, departments, department, teams, team, employeeStatuses, orgMap, summary }, dispatchLeave] = useReducer(leaveReducer,
        {
            employee: null, leaves: [], leaveMap: {}, isLoading: false, startDate: dayjs(getStartDateOfThisYear()).toDate(), endDate: dayjs(getEndDateOfThisYear()).toDate(),
            locations: [], location: null, businessUnits: [], businessUnit: null, departments: [], department: null, teams: [], team: null, employeeStatuses: [], orgMap: {}, summary: {}
        });
    const { handleRequest, handleRequestWithNewToken } = useHttp();

    const handleEmployeeChange = (email) => {
        dispatchLeave({ type: ACTIONS.SET_EMPLOYEE, employee: email });
    }

    const handleLocationChange = (location) => {
        dispatchLeave({ type: ACTIONS.SET_LOCATION, location });
    }

    const handleDateChange = (type) => (date) => {
        dispatchLeave({ type: ACTIONS.SET_DATE_RANGE, [type]: date });
    }

    const loadSummary = () => {
        dispatchLeave({ type: ACTIONS.SET_IS_LOADING, isLoading: true });
        handleRequestWithNewToken(() => {
            handleRequest(`${services.GENERATE_REPORT}`, "POST", {
                startDate: getDateFromDateString(startDate),
                endDate: getDateFromDateString(endDate),
                businessUnit,
                department,
                team,
                location: location ? (location.serverName ? location.serverName : location.label) : null,
                employeeStatuses,
            },
                (data) => {
                    if (data) {
                        let tempData = data;
                        Object.keys(data).forEach(key => {
                            if (tempData[key].sick) {// TODO REMOVE AFTER MIGRATION
                                if (tempData[key].casual) {
                                    tempData[key].casual = tempData[key].casual + tempData[key].sick
                                } else {
                                    tempData[key]['casual'] = tempData[key].sick
                                }
                            }
                        });
                        dispatchLeave({ type: ACTIONS.SET_SUMMARY, summary: tempData });
                    }
                }, () => { },
                (isLoading) => {
                    dispatchLeave({ type: ACTIONS.SET_IS_LOADING, isLoading });
                });
        });
    };

    const loadReportFilters = () => {
        handleRequestWithNewToken(() => {
            handleRequest(`${services.FETCH_REPORT_FILTERS}`, "GET", null,
                (data) => {
                    let businessUnits = [];
                    let departmentsMap = {};
                    let teamsMap = {};
                    let orgMapTemp = {};
                    if (data) {
                        if (data.orgStructure) {
                            data.orgStructure.forEach(bu => {
                                let deptMap = {};
                                let departmentsForBu = [];
                                bu.children.forEach(dept => {
                                    let teamMap = {};
                                    let teamsForDept = [];
                                    dept.children.forEach(team => {
                                        teamMap[team.name] = null;
                                        teamsForDept.push(team);
                                        teamsMap[team.name] = team;
                                    });
                                    departmentsMap[dept.name] = dept;
                                    departmentsForBu.push({ ...dept, teams: teamsForDept });
                                    deptMap[dept.name] = { teamsForDept, teamMap };
                                })
                                businessUnits.push({ ...bu, departments: departmentsForBu });
                                orgMapTemp[bu.name] = { departmentsForBu, deptMap };
                            })
                        }
                    }
                    dispatchLeave({
                        type: ACTIONS.SET_REPORT_FILTERS,
                        locations: data.countries,
                        businessUnits,
                        departments: Object.values(departmentsMap),
                        teams: Object.values(teamsMap),
                        orgMap: orgMapTemp
                    });
                }, () => { },
                (isLoading) => {
                    dispatchLeave({ type: ACTIONS.SET_IS_LOADING, isLoading });
                });
        });
    }

    const handleReportFilters = (type) => (event) => {
        const {
            target: { value },
        } = event;
        dispatchLeave({ type: type, value });
    };

    const handleEmployeeStatus = (event) => {
        const {
            target: { value },
        } = event;
        dispatchLeave({ type: ACTIONS.SET_EMPLOYEE_STATUS, employeeStatuses: value });
    };

    useEffect(() => {
        loadReportFilters();
    }, []);

    return (
        <Grid
            container
            direction="row"
            justifyContent="space-around"
            alignItems="flex-start"
            spacing={2}
        >
            <Grid item xs={12}>
                {isLoading && <LinearProgress color="secondary" />}
            </Grid>
            <Grid item md={8} lg={9}>
                <OverallLeaveReport summary={summary} isLoading={isLoading} />
            </Grid>
            <Grid item md={4} lg={3}>
                <Card>
                    <CardContent>
                        <Box
                            sx={{
                                alignItems: 'center',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-gb'}>
                                <Stack
                                    direction="column"
                                    justifyContent="center"
                                    alignItems="center"
                                    spacing={3}
                                >
                                    <span><CountryPicker visibleCountries={locations} onChange={handleLocationChange} /></span>
                                    <span><FormControl sx={{ m: 1, minWidth: 220 }}>
                                        <InputLabel id="bu-select-small-label">Business Unit</InputLabel>
                                        <Select
                                            labelId="bu-select-small-label"
                                            id="bu-select-small"
                                            value={businessUnit}
                                            label="Business Unit"
                                            onChange={handleReportFilters(ACTIONS.SET_BUSINESS_UNIT)}
                                            // displayEmpty
                                            inputProps={{ 'aria-label': 'Without label' }}
                                            disabled={isLoading}
                                        >
                                            <MenuItem value={null}>
                                                <em>None</em>
                                            </MenuItem>
                                            {businessUnits.map((bu) => {
                                                return <MenuItem value={bu.name}>{bu.name}</MenuItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                    </span>
                                    <span>
                                        <FormControl sx={{ m: 1, minWidth: 220 }}>
                                            <InputLabel id="department-select-small-label">Department</InputLabel>
                                            <Select
                                                labelId="department-select-small-label"
                                                id="department-select-small"
                                                value={department}
                                                label="Department"
                                                onChange={handleReportFilters(ACTIONS.SET_DEPARTMENT)}
                                                disabled={isLoading}
                                            // displayEmpty
                                            >
                                                <MenuItem value={null}>
                                                    <em>None</em>
                                                </MenuItem>
                                                {departments.map((dept) => {
                                                    return <MenuItem value={dept.name}>{dept.name}</MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                    </span>
                                    <span>
                                        <FormControl sx={{ m: 1, minWidth: 220 }}>
                                            <InputLabel id="team-select-small-label">Team</InputLabel>
                                            <Select
                                                labelId="team-select-small-label"
                                                id="team-select-small"
                                                value={team}
                                                label="Team"
                                                onChange={handleReportFilters(ACTIONS.SET_TEAM)}
                                                disabled={isLoading}
                                                // displayEmpty
                                                inputProps={{ 'aria-label': 'Without label' }}
                                            >
                                                <MenuItem value={null}>
                                                    <em>None</em>
                                                </MenuItem>
                                                {teams.map((team) => {
                                                    return <MenuItem value={team.name}>{team.name}</MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                    </span>
                                    <span>
                                        <FormControl sx={{ m: 1, width: 220 }}>
                                            <InputLabel id="demo-multiple-chip-label">Employee Status</InputLabel>
                                            <Select
                                                labelId="demo-multiple-chip-label"
                                                id="demo-multiple-chip"
                                                multiple
                                                value={employeeStatuses}
                                                onChange={handleEmployeeStatus}
                                                input={<OutlinedInput id="select-multiple-chip" label="Employee Status" />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((status) => (
                                                            <Chip key={status} label={status} style={{ backgroundColor: LEAVE_APP.EMPLOYEE_STATUS[status].color }} />
                                                        ))}
                                                    </Box>
                                                )}
                                                MenuProps={MenuProps}
                                            >
                                                {Object.values(LEAVE_APP.EMPLOYEE_STATUS).map((status) => (
                                                    <MenuItem
                                                        key={status.value}
                                                        value={status.value}
                                                        style={{
                                                            color: status.color,
                                                        }}
                                                    >
                                                        {status.value}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </span>
                                    <span><DatePicker value={dayjs(startDate)} onChange={handleDateChange("startDate")} label="Start date" /></span>
                                    <span><DatePicker value={dayjs(endDate)} onChange={handleDateChange("endDate")} label="End date" /></span>
                                    <span>
                                        <LoadingButton
                                            color="secondary"
                                            size="small"
                                            onClick={loadSummary}
                                            loading={isLoading}
                                            loadingIndicator="Fetching…"
                                            variant="contained"
                                        >
                                            <span>Fetch Report</span>
                                        </LoadingButton>
                                    </span>
                                </Stack>
                            </LocalizationProvider>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

export default LeaveReportOverall;