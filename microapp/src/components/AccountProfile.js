import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Divider,
    Skeleton,
    Typography
} from '@mui/material';
import EmailPicker from './EmailPicker';
import { setEmployeeData } from '../store/reducers/menu';
import { useDispatch, useSelector } from 'react-redux';
import useHttp from '../utils/http';
import { services } from '../config';
import { LEAVE_APP } from '../constants';

export const AccountProfile = props => {
    const { employee, handleEmployeeChange } = props;
    const dispatch = useDispatch();
    const { handleRequest, handleRequestWithNewToken } = useHttp();
    const [isLoading, setIsLoading] = useState(false);
    const { employeeData, employeeMap } = useSelector((state) => state.menu);

    const loadEmployeeData = () => {
        const successFn = (data) => {
            if (data) {
                dispatch(setEmployeeData({ employeeData: data }));
            }
        };

        const errorFunc = (error) => {
            // showAlert("Error", "Error while fetching employee data", "Close", () => { }, () => { });
        };

        const loadingFunc = (isLoading) => {
            setIsLoading(isLoading);
        };

        handleRequestWithNewToken(() => {
            handleRequest(`${services.FETCH_EMPLOYEES}?employeeStatuses=${LEAVE_APP.EMPLOYEE_STATUS.Active.value},${LEAVE_APP.EMPLOYEE_STATUS['Marked leaver'].value},${LEAVE_APP.EMPLOYEE_STATUS.Left.value}`,
                'GET', null, successFn, errorFunc, loadingFunc);
        });
    };

    useEffect(() => {

    }, [employee])

    useEffect(() => {
        loadEmployeeData();
    }, []);
    return (
        <>
            <EmailPicker email={employee} handleEmailChange={handleEmployeeChange} />
            <Card>
                <CardContent>
                    <Box
                        sx={{
                            alignItems: 'center',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {employee ?
                            <>
                                <Avatar
                                    src={employee.employeeThumbnail}
                                    sx={{
                                        height: 80,
                                        mb: 2,
                                        width: 80
                                    }}
                                    alt={employee.firstName}
                                />
                                <Typography
                                    gutterBottom
                                    variant="h5"
                                >
                                    {(employee.firstName && employee.lastName) ? `${employee.firstName} ${employee.lastName}` : employee.workEmail}
                                </Typography>
                            </>
                            :
                            <>
                                <Skeleton variant="circular" width={80} height={80} />
                                <Skeleton variant="text" sx={{ fontSize: '1rem' }} width={80} />
                            </>
                        }
                    </Box>
                </CardContent>
                {/* <Divider />
                <CardActions>
                    <Button
                        fullWidth
                        variant="text"
                    >
                        Upload picture
                    </Button>
                </CardActions> */}
            </Card>
        </>
    )
};
