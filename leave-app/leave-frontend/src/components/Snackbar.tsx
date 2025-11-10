import React from 'react';
import MuiSnackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const Snackbar: React.FC<{ message: string; type?: 'success' | 'error'; onClose?: () => void }> = ({ message, type = 'success', onClose }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <MuiSnackbar
      open={!!message}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: isXs ? 'top' : 'bottom', horizontal: 'center' }}
      sx={{
        // ensure margin from edges on small screens
        '& .MuiPaper-root': { maxWidth: { xs: 'calc(100vw - 32px)', sm: 560 } },
      }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        variant="filled"
        sx={{
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          minWidth: { xs: 'auto', sm: 200 },
          maxWidth: '100%',
          textAlign: 'center',
          fontWeight: 500,
          fontSize: { xs: '0.875rem', sm: '0.95rem' },
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.25 },
        }}
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
