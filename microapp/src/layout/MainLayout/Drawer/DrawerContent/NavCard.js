// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from 'react';
// material-ui
import { Box, Button, Collapse, Link, Stack, Typography } from '@mui/material';

// project import
import MainCard from '../../../../components/MainCard';
import { getGmailMailTo } from '../../../../utils/formatting';
import { LEAVE_APP } from '../../../../constants';

// ==============================|| DRAWER CONTENT - NAVIGATION CARD ||============================== //

const NavCard = () => (
    <MainCard sx={{ bgcolor: 'grey.50', m: 3 }}>
        <Stack alignItems="center" spacing={2.5}>
            <Collapse in={true} orientation="horizontal" classes={{ wrapperInner: { width: '100%' } }}
                        timeout={2}>
                        <Box
                            sx={{
                                backgroundColor: 'background.default',
                                m: 2,
                                p: 2
                            }}
                        >

                            <Typography
                                align="center"
                                gutterBottom
                                variant="h4"
                                noWrap
                            >
                                Need help?
                            </Typography>
                            <Typography
                                align="center"
                                variant="body2"
                                noWrap
                            >
                                Contact Internal Apps
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    pt: 2
                                }}
                            >
                                <Link href={getGmailMailTo(LEAVE_APP.EMAILS.GET_HELP_EMAIL_TO, LEAVE_APP.EMAILS.GET_HELP_EMAIL_SUBJECT)} target="_blank" rel="noreferrer">
                                    <Button
                                        color="primary"
                                        variant="contained"
                                    >
                                        Get Help
                                    </Button>
                                </Link>
                            </Box>
                        </Box>
                    </Collapse>
        </Stack>
    </MainCard>
);

export default NavCard;
