import React from 'react';
// assets
import {
    Add as AddIcon,
    Assessment as AssessmentIcon,
    Event as EventIcon,
    History as HistoryIcon,
    BarChart as BarChartIcon,
} from '@mui/icons-material';
import { OAUTH_CONFIG } from '../config';
import { checkIfRolesExist } from '../utils/oauth';


// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const pages = {
    id: 'views',
    title: 'Views',
    type: 'group',
    children: [
        {
            id: 'form',
            title: 'New Leave',
            type: 'item',
            url: '/form',
            icon: (props) => (<AddIcon {...props} />),
            target: true,
            isAdmin: false
        },
        {
            id: 'history',
            title: 'History',
            type: 'item',
            url: '/history',
            icon: (props) => (<HistoryIcon {...props} />),
            target: true,
            isAdmin: false
        },
        {
            id: 'leads',
            title: 'Lead Reports',
            type: 'item',
            url: '/leads',
            icon: (props) => (<AssessmentIcon {...props} />),
            target: true,
            isLead: true,
            isAdmin: false
        },
        {
            id: 'reports',
            title: 'Reports',
            type: 'item',
            url: '/reports',
            icon: (props) => (<BarChartIcon {...props} />),
            target: true,
            isAdmin: true
        }
    ]
};

export default pages;
