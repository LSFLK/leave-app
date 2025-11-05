// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { Fragment } from 'react';
// project import
import NavCard from './NavCard';
import Navigation from './Navigation';
// import SimpleBar from '../../../../components/third-party/SimpleBar';

import { isDesktop } from 'react-device-detect';
import { Box, Stack } from '@mui/material';

// ==============================|| DRAWER CONTENT ||============================== //

const DrawerContent = () => (
    <Box style={{ height: '100%' }}>
        <Stack
            sx={{ height: '100%' }}
            direction="column"
            justifyContent="space-between"
            alignItems="stretch"
            spacing={2}
        >
            <span>
                <Navigation />
            </span>
            <span>
                <div style={{ width: 100 }} />
            </span>
        </Stack>
    </Box>
);

export default DrawerContent;
