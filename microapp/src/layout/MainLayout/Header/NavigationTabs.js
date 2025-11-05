// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import pages from '../../../menu-items/pages';
import { useDispatch, useSelector } from 'react-redux';

import { navigateToView } from '../../../store/reducers/menu';
import { checkIfRolesExist, getIsAdmin } from '../../../utils/oauth';
import { OAUTH_CONFIG } from '../../../config';

function LinkTab(props) {
  return (
    <Tab
      component="a"
      onClick={(event) => {
        event.preventDefault();
      }}
      {...props}
    />
  );
}

export default function NavigationTabs() {
  const dispatch = useDispatch();
  const { isAdmin, isLead, navigatedView } = useSelector((state) => state.menu);
  const [value, setValue] = useState(navigatedView);

  const handleChange = (event, newValue) => {
    dispatch(navigateToView({ navigatedView: newValue }));
  };

  useEffect(() => {
    setValue(navigatedView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigatedView, isAdmin, isLead]);

  return (
    <Tabs value={navigatedView} onChange={handleChange} aria-label="navigation tabs" variant="fullWidth" centered>
      {pages.children.map(page => {
        return (page.isAdmin && !isAdmin) || (page.isLead || !isLead) ?
          null
          : <LinkTab icon={page.icon} value={page.id} key={page.id} label={page.title} iconPosition="start" aria-label={page.title} href={page.url} />
      }
      )}
    </Tabs>
  );
}