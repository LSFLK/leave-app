import React, { useEffect, useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

import pages from '../../../menu-items/pages';
import { useDispatch, useSelector } from 'react-redux';
import { navigateToView } from '../../../store/reducers/menu';
import { useTheme } from '@mui/material/styles';
import { checkIfRolesExist } from '../../../utils/oauth';
import { OAUTH_CONFIG } from '../../../config';

export default function LabelBottomNavigation() {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { isAdmin, isLead, navigatedView } = useSelector((state) => state.menu);
    const [value, setValue] = useState(navigatedView);

    const handleChange = (event, newValue) => {
        dispatch(navigateToView({ navigatedView: newValue }));
    };

    const bottomNavigationSx = {
        '& .Mui-selected': {
            color: theme.palette.secondary.main,
        },
    };

    useEffect(() => {
        setValue(navigatedView);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigatedView, isAdmin, isLead]);

    return (
        <BottomNavigation sx={{ width: '100%' }} value={value} onChange={handleChange}>
            {pages.children.map(page => {
                return (page.isAdmin && !isAdmin) || (page.isLead && !isLead) ? null : (
                <BottomNavigationAction
                    sx={bottomNavigationSx}
                    label={page.title}
                    value={page.id}
                    icon={page.icon({color: value === page.id ? 'secondary' : 'primary'})}
                />
            )})}
        </BottomNavigation>
    );
}
