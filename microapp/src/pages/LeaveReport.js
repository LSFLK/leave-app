// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState, useReducer, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
// import SwipeableViews from 'react-swipeable-views';
import { useTheme } from '@mui/material/styles';

// material-ui imports
import {
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import {
    AppBar,
    Box,
    Container,
    Fab,
    Fade,
    Grid,
    Slide,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    Tab,
    Tabs,
    Toolbar,
    Typography,
    useScrollTrigger,
    Card,
    CardContent,
    Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';

import useHttp from '../utils/http';
import LeaveReportUser from './LeaveReportUser';
import LeaveReportOverall from './LeaveReportOverall';

const headCells = [
    { id: 'num_days', numeric: true, disablePadding: false, label: 'Number of days' },
    { id: 'start_date', numeric: true, disablePadding: false, label: 'Start Date' },
    { id: 'end_date', numeric: true, disablePadding: false, label: 'End Date' },
    { id: 'created_date', numeric: true, disablePadding: false, label: 'Submitted Date' },
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
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
};

const StyledTableCell = styled((props) => <TableCell {...props} />)(
    ({ theme }) => ({
        head: {
            backgroundColor: '#aaa',
            color: theme.palette.common.white,
        },
        body: {
            fontSize: 14,
        },
    }),
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
                        align={'center'}
                        padding={headCell.disablePadding ? 'none' : 'default'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
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
};

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
            '#back-to-top-anchor',
        );

        if (anchor) {
            anchor.scrollIntoView({
                block: 'center',
            });
        }
    };

    return (
        <Fade in={trigger}>
            <Box
                onClick={handleClick}
                role="presentation"
                sx={{ position: 'fixed', bottom: 70, right: 16 }}
            >
                {children}
            </Box>
        </Fade>
    );
}

EnhancedTableHead.propTypes = {
    classes: PropTypes.object.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
};

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

export default function LeaveHistory(props) {
    const theme = useTheme();
    const { handleRequest, handleRequestWithNewToken } = useHttp();
    const [leaves, setLeaves] = useState([]);
    const [value, setValue] = React.useState(0);
    const [employee, setEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index) => {
        setValue(index);
    };

    return (
        <Box sx={{ bgcolor: 'background.paper', height: "100%" }}>
            <AppBar position="static">
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="secondary"
                    textColor="secondary"
                    variant="fullWidth"
                    aria-label="full width tabs example"
                >
                    <Tab sx={{ color: '#fff' }} label="Employee" {...a11yProps(0)} />
                    <Tab sx={{ color: '#fff' }} label="Overall" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            {/* <SwipeableViews
                axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                index={value}
                onChangeIndex={handleChangeIndex}
            >
                <TabPanel sx={{ height: "100%" }} value={value} index={0} dir={theme.direction}>
                    <LeaveReportUser/>
                </TabPanel>
                <TabPanel value={value} index={1} dir={theme.direction}>
                    <LeaveReportOverall/>
                </TabPanel>
            </SwipeableViews> */}
        </Box>
    );
}