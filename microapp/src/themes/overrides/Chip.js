// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

// ==============================|| OVERRIDES - CHIP ||============================== //

export default function Chip(theme) {
    return {
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    '&:active': {
                        boxShadow: 'none',
                    },
                    // '&hover': {
                    //     color: theme.palette.primary.main,
                    //     backgroundColor: theme.palette.primary.main,
                    //     borderColor: theme.palette.primary.main
                    // },
                    // '&.Mui-focusVisible': {
                    //     color: theme.palette.primary.main,
                    //     backgroundColor: theme.palette.primary.main,
                    //     borderColor: theme.palette.primary.main
                    // },
                },
                sizeLarge: {
                    fontSize: '1rem',
                    height: 40
                },
                light: {
                    color: theme.palette.primary.main,
                    backgroundColor: theme.palette.primary.lighter,
                    borderColor: theme.palette.primary.light,
                    '&.MuiChip-lightError': {
                        color: theme.palette.error.main,
                        backgroundColor: theme.palette.error.lighter,
                        borderColor: theme.palette.error.light
                    },
                    '&.MuiChip-lightSuccess': {
                        color: theme.palette.success.main,
                        backgroundColor: theme.palette.success.lighter,
                        borderColor: theme.palette.success.light
                    },
                    '&.MuiChip-lightWarning': {
                        color: theme.palette.warning.main,
                        backgroundColor: theme.palette.warning.lighter,
                        borderColor: theme.palette.warning.light
                    }
                }
            }
        }
    };
}
