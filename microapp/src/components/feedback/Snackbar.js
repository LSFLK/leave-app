import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Slide } from '@mui/material';

export default function ConsecutiveSnackbars(props) {
    const [snackPack, setSnackPack] = useState([]);
    const [open, setOpen] = useState(false);
    const [messageInfo, setMessageInfo] = useState(undefined);

    useEffect(() => {
        if (snackPack.length && !messageInfo) {
            // Set a new snack when we don't have an active one
            setMessageInfo({ ...snackPack[0] });
            setSnackPack((prev) => prev.slice(1));
            setOpen(true);
        } else if (snackPack.length && messageInfo && open) {
            // Close an active snack when a new one is added
            setOpen(false);
        }
    }, [snackPack, messageInfo, open]);

    useEffect(() => {
        setSnackPack(props.snackPack);
    }, [props.snackPack]);

    const handleClick = (message) => () => {
        setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleExited = () => {
        setMessageInfo(undefined);
    };


    return (
        <Snackbar
            key={messageInfo ? messageInfo.key : undefined}
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
            TransitionComponent={Slide}
            TransitionProps={{ onExited: handleExited }}
            message={messageInfo ? messageInfo.message : undefined}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            // action={
            //     <Fragment>
            //         <Button color="secondary" size="small" onClick={handleClose}>
            //             UNDO
            //         </Button>
            //         <IconButton
            //             aria-label="close"
            //             color="inherit"
            //             sx={{ p: 0.5 }}
            //             onClick={handleClose}
            //         >
            //             <CloseIcon />
            //         </IconButton>
            //     </Fragment>
            // }
            sx={{ bottom: { xs: 60, sm: 0 } }}
        >
            <Alert onClose={handleClose} variant="filled" severity="success" sx={{ width: '100%' }}>
                {messageInfo ? messageInfo.message : undefined}
            </Alert>
        </Snackbar>
    );
}
