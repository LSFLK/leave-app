// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from 'react';
// material-ui
import { Box, Typography } from '@mui/material';

// project import
import Profile from './Profile';
import { APPLICATION_CONFIG } from '../../../../config';
import logo from '../../../../images/logo.png';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = () => (
    <>
        <span style={{
            maxWidth: 80,
            paddingRight: 10,
            marginTop: 4,
        }}>
            <img src={logo} alt="Logo" style={{ width: '100%' }} />
        </span>
        <Typography variant="h5" overflow={"visible"} noWrap>
            {APPLICATION_CONFIG.appName}
        </Typography>
        <Box sx={{ width: '100%', ml: 1 }} />
        <Profile />
    </>
);

export default HeaderContent;
