// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

// types
import { createSlice } from '@reduxjs/toolkit';

// initial state
const initialState = {
    isLoading: false,
    openBasicDialog: false,
    basicDialogInfo: {},
    basicDialogCallbackFn: () => {},
    showSnackbar: false,
    snackbarAlertStack: [],
};

// ==============================|| SLICE - MENU ||============================== //

const menu = createSlice({
    name: 'feedback',
    initialState,
    reducers: {
        openBasicDialog(state, action) {
            state.openBasicDialog = action.payload.openBasicDialog;
            state.basicDialogInfo = {message: action.payload.basicDialogMessage};
            state.basicDialogCallbackFn = action.payload.basicDialogCallbackFn;
        },

        showSnackbar(state, action) {
            state.snackbarAlertStack = [...state.snackbarAlertStack, { message: action.payload.snackbarMessage, key: new Date().getTime() }];
        },

        handleIsLoading(state, action) {
            state.isLoading = action.payload.isLoading;
        }
    }
});

export default menu.reducer;

export const { openBasicDialog, showSnackbar, handleIsLoading } = menu.actions;
