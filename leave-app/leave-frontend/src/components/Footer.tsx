
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Footer: React.FC = () => (
  <Box
    component="footer"
    sx={{
      width: '100%',
  bgcolor: 'background.paper',
      py: 2,
      px: 4,
      textAlign: 'center',
      fontSize: '1rem',
      fontWeight: 500,
      position: 'fixed',
      left: 0,
      bottom: 0,
      zIndex: 100,
    }}
  >
    <Typography variant="body1">
      &copy; {new Date().getFullYear()} Leave Management. All rights reserved.
    </Typography>
  </Box>
);

export default Footer;
