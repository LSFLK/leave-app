// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { Fragment, lazy } from 'react';

// project import
import Loadable from '../components/Loadable';
import MainLayout from '../layout/MainLayout/index';

// render - Leave Form
const LeaveForm = Loadable(lazy(() => import('../pages/LeaveForm')));
const LeaveHistory = Loadable(lazy(() => import('../pages/LeaveHistory')));
const LeaveReport = Loadable(lazy(() => import('../pages/LeaveReport')));
const LeadReport = Loadable(lazy(() => import('../pages/LeadReport')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
    path: '/',
    element: <MainLayout />,
    children: [
        {
            index: true,
            // path: 'form',
            element: <LeaveForm />
        },
        {
            path: 'history',
            element: <LeaveHistory />
        }, 
        {
            path: 'leads',
            element: <LeadReport />
        },
        {
            path: 'reports',
            element: <LeaveReport />
        }
    ]
};

export default MainRoutes;
