// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

// types
import { createSlice } from '@reduxjs/toolkit';

import { getSortedPeople } from '../../utils/formatting';

// initial state
const initialState = {
    isAdmin: false,
    isLead: false,
    openItem: ['form'],
    openComponent: 'buttons',
    drawerOpen: false,
    componentDrawerOpen: true,
    navigatedView: 'form',
    employeeData: [],
    employeeMap: {}
};

// ==============================|| SLICE - MENU ||============================== //

const menu = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        setIsAdmin(state, action) {
            state.isAdmin = action.payload.isAdmin;
        },

        setIsLead(state, action) {
            state.isLead = action.payload.isLead;
        },

        activeItem(state, action) {
            state.openItem = action.payload.openItem;
        },

        activeComponent(state, action) {
            state.openComponent = action.payload.openComponent;
        },

        openDrawer(state, action) {
            state.drawerOpen = action.payload.drawerOpen;
        },

        openComponentDrawer(state, action) {
            state.componentDrawerOpen = action.payload.componentDrawerOpen;
        },

        navigateToView(state, action) {
            state.navigatedView = action.payload.navigatedView;
        },

        setEmployeeData(state, action) {
            const sortedPeople = getSortedPeople(action.payload.employeeData)
            state.employeeData = sortedPeople;
            var tempMap = {};
            sortedPeople.forEach((person) => {
                if (person.workEmail) {
                    tempMap[person.workEmail] = person;
                }
            });
            state.employeeMap = tempMap;
        }
    }
});

export default menu.reducer;

export const {
    setIsAdmin,
    setIsLead,
    activeItem,
    activeComponent,
    openDrawer,
    openComponentDrawer,
    navigateToView,
    setEmployeeData
} = menu.actions;
