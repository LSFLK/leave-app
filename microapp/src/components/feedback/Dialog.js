import React, { useState, useEffect, forwardRef } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Slide, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/system';
import { openBasicDialog, showSnackbar } from '../../store/reducers/feedback';

import useHttp from '../../utils/http';
import { services } from '../../config';
import { LoadingButton } from '@mui/lab';
import { useDispatch } from 'react-redux';

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ConfirmationDialog(props) {
    const theme = useTheme();
    const { isLoading } = props;
    const dispatch = useDispatch();
    const [open, setOpen] = useState(props.open);
    const matchesMdDown = useMediaQuery(theme.breakpoints.down('md'));
    const { title, message, okCallback, closeCallback } = props;

    const handleClose = () => {
        closeCallback && closeCallback();
        setOpen(false);
        dispatch(openBasicDialog({ openBasicDialog: false, basicDialogMessage: '', basicDialogCallbackFn: () => { } }));
    };

    useEffect(() => { setOpen(props.open) }, [props.open])
    useEffect(() => { }, [title, message, okCallback, closeCallback, isLoading]);

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            onClose={handleClose}
            maxWidth={matchesMdDown ? "sm" : "md"}
            fullWidth
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                <Typography variant='h5'>{title ? title : "Confirmation"}</Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant='body1' id="alert-dialog-description">
                    {message ? message : "Click okay to confirm action."}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined" size="small">Close</Button>
                <LoadingButton loading={isLoading} onClick={okCallback} color="secondary" variant="contained" size="small">
                    Confirm
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
