
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
      position: { xs: 'static', sm: 'fixed' },
      left: { sm: 0 },
      bottom: { sm: 0 },
      zIndex: { sm: 100 },
    }}
  >
    <Typography variant="body1">
      &copy; {new Date().getFullYear()} Leave Management. All rights reserved.
    </Typography>
  </Box>
);

export default Footer;
