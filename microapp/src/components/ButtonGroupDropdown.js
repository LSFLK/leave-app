// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState } from 'react';
import { Button, ButtonGroup, Grid } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { LEAVE_APP } from '../constants';

export default function ResponsiveDatePickers(props) {


    return (
        <Grid container direction="column" alignItems="center">
            <Grid item xs={12}>
                <ButtonGroup variant="contained" color="secondary" aria-label="split button">

                    <Button
                        startIcon={LEAVE_APP.LEAVE_TYPES.annual.icon}
                    >
                        {LEAVE_APP.LEAVE_TYPES.annual.title}
                    </Button>
                    <Button
                        color="secondary"
                        size="small"
                        aria-label="select merge strategy"
                        aria-haspopup="menu"
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
            </Grid>
        </Grid>

    );
}
