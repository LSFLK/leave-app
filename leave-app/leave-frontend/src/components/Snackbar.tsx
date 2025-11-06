import React from 'react';
import MuiSnackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const Snackbar: React.FC<{ message: string; type?: 'success' | 'error'; onClose?: () => void }> = ({ message, type = 'success', onClose }) => (
  <MuiSnackbar
    open={!!message}
    autoHideDuration={4000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert
      onClose={onClose}
      severity={type}
      variant="filled"
      sx={{ background: 'rgba(0,0,0,0.85)', color: '#fff', minWidth: 200, textAlign: 'center', fontWeight: 500 }}
    >
      {message}
    </Alert>
  </MuiSnackbar>
);

export default Snackbar;
