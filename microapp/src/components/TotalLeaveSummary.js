// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState, useEffect } from 'react';
import {
    Chip,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Typography
} from '@mui/material';

import { getLeaveTypes } from '../utils/utils';

const TotalSummary = (props) => {
    const [totalLeave, setTotalLeave] = useState(0);
    const [totalLeaveUncounted, setTotalLeaveUncounted] = useState(0);
    const showEmptyLeave = false;

    const getTotal = () => {
        var count = 0;
        getLeaveTypes().forEach((leave) => {
            if (props.summaryMap[leave.type] && leave.isCounted) {
                count += props.summaryMap[leave.type].count;
            }
        });
        return count;
    };

    const getTotalOfUncounted = () => {
        var count = 0;
        getLeaveTypes().forEach((leave) => {
            if (props.summaryMap[leave.type] && !leave.isCounted) {
                count += props.summaryMap[leave.type].count;
            }
        });
        return count;
    };

    useEffect(() => {
        setTotalLeave(getTotal());
        setTotalLeaveUncounted(getTotalOfUncounted());
    }, [props.summaryMap]);

    return (
        <Grid container spacing={2}>
            {/* <Grid item xs={12}>
                <Divider />
            </Grid> */}
            <Grid item xs={12} md={6}>
                <Paper variant="outlined">
                    {/* {totalLeave > 0 ?  */}
                    <List>
                        {getLeaveTypes().map((leave) => {
                            // if (!leave.isCounted || (!showEmptyLeave && (props.summaryMap[leave.type] && props.summaryMap[leave.type].count === 0))) {
                            //     return false;
                            // }
                            if (!leave.isCounted) {
                                return false;
                            }
                            return (
                                <ListItem>
                                    <ListItemIcon sx={{ marginRight: 1 }}>
                                        {leave.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={leave.title}
                                    />
                                    <ListItemSecondaryAction>
                                        <Chip label={props.summaryMap[leave.type] && props.summaryMap[leave.type].count ? props.summaryMap[leave.type].count : 0}></Chip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            );
                        })}
                        <Divider />
                        <ListItem>
                            <ListItemIcon sx={{ marginRight: 1 }}>
                            </ListItemIcon>
                            {/* <ListItemText
                                    primary={"Total"}
                                /> */}
                            <Typography variant="subtitle1">
                                Total
                            </Typography>
                            <ListItemSecondaryAction>
                                <Chip label={totalLeave} color="secondary"></Chip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </List>
                    {/* : <EmptyListText text="No Leave to show" />} */}
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper variant="outlined">
                    {/* {totalLeaveUncounted > 0 ?  */}
                    <List>
                        {getLeaveTypes().map((leave) => {
                            if (leave.isCounted) {
                                return false;
                            }
                            return (
                                <ListItem>
                                    <ListItemIcon sx={{ marginRight: 1 }}>
                                        {leave.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={leave.title}
                                    />
                                    <ListItemSecondaryAction>
                                        <Chip label={props.summaryMap[leave.type] && props.summaryMap[leave.type].count ? props.summaryMap[leave.type].count : 0}></Chip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            );
                        })}
                    </List>
                    {/* : <EmptyListText text="No Lieu Leave to show" />} */}
                </Paper>
            </Grid>
        </Grid>
    );
}

export default TotalSummary;
