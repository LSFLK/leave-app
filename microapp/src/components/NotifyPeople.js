// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React, { useState, useEffect, useReducer, Fragment } from "react";
import { useSelector } from "react-redux";
import { VariableSizeList } from "react-window";

/** Material UI imports */
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import {
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Box,
} from "@mui/material";
import {
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

/** Custom imports */
import AdditionalComment from "./AdditionalComment";
import { LEAVE_APP, PRIVATE_EMAIL_TEXT, PUBLIC_EMAIL_TEXT } from "../constants";
const LISTBOX_PADDING = 8; // px

function renderRow(props) {
  const { data, index, style } = props;
  const dataSet = data[index][0];
  const item = data[index][1];
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  };

  return (
    <Box
      component="li"
      {...dataSet}
      sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
      {...props}
      style={inlineStyle}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {item && (item.employeeThumbnail || item.employeeThumbnail === "") ? (
          <span>
            <Avatar
              size="small"
              loading="lazy"
              sx={{ width: 24, height: 24 }}
              src={item.employeeThumbnail}
              alt={item.workEmail}
            />
          </span>
        ) : (
          <Avatar sx={{ width: 24, height: 24 }}>
            <PersonIcon fontSize="small" />
          </Avatar>
        )}
        <span>{item.workEmail}</span>
      </Stack>
    </Box>
  );
}
const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

const OuterElementContext = React.createContext({});
function useResetCache(data) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}
// Adapter for react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(
  props,
  ref
) {
  const { children, ...other } = props;
  const itemData = [];
  children.forEach((item) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up("sm"), {
    noSsr: true,
  });
  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child) => {
    if (child.hasOwnProperty("group")) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={(index) => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});
const NotifyPeople = (props) => {
  const {
    defaultRecipients,
    emailRecipients,
    savedRecipients,
    handleEmailPicker,
    handleAddRecipient,
    handleRemoveEmail,
    comment,
    isPublicComment,
    handleComment,
    handlePublicComment,
  } = props;
  const { employeeData, employeeMap } = useSelector((state) => state.menu);
  const [fixedOptions, setFixedOptions] = useState(
    LEAVE_APP.DEFAULT_EMAIL_RECIPIENTS
  );
  const [options, setOptions] = useState([]);
  const filter = createFilterOptions();

  const handleResetRecipients = () => {
    handleAddRecipient([
      ...LEAVE_APP.DEFAULT_EMAIL_RECIPIENTS,
      ...defaultRecipients,
      ...savedRecipients,
    ]);
  };

  const handleOnChange = (newValues) => {
    var valuesToBeAdded = [];
    fixedOptions.forEach((option) => {
      if (
        !newValues.some((newValue) => option.workEmail === newValue.workEmail)
      ) {
        valuesToBeAdded.push(option);
      }
    });
    valuesToBeAdded = [...valuesToBeAdded, ...newValues];
    handleAddRecipient(valuesToBeAdded);
  };

  const handleOnDelete = (email) => () => {
    handleRemoveEmail(email);
  };

  const checkIfDefaultRecipients = () => {
    // Checks the same order of recipients. Not individual recipients
    const resetRecipients = [
      ...LEAVE_APP.DEFAULT_EMAIL_RECIPIENTS,
      ...defaultRecipients,
      ...savedRecipients,
    ];
    const defaultRecipientEmails = resetRecipients.map((e) => e.workEmail);
    return emailRecipients.every((e) =>
      defaultRecipientEmails.includes(e.workEmail)
    );
  };

  useEffect(() => {
    const fixedOptions = [
      ...LEAVE_APP.DEFAULT_EMAIL_RECIPIENTS,
      ...defaultRecipients,
    ];
    setFixedOptions(fixedOptions);
    var options = [];
    employeeData.forEach((employee) => {
      if (
        fixedOptions.some((option) => option.workEmail === employee.workEmail)
      ) {
        return;
      }
      options.push(employee);
    });

    setOptions(options);
  }, [props.isLoading, emailRecipients, defaultRecipients, employeeData]);

  useEffect(() => {}, [comment, isPublicComment]);

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #ddd",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography
              sx={{
                padding: 1,
              }}
            >
              Email Recipients ({emailRecipients.length})
            </Typography>
            {props.isLoading ? (
              <CircularProgress
                color="secondary"
                sx={{
                  height: "20px !important",
                  width: "20px !important",
                  marginRight: "10px !important",
                }}
              />
            ) : (
              !checkIfDefaultRecipients() && (
                <IconButton
                  onClick={handleResetRecipients}
                  color="primary"
                  aria-label="Refresh recipients"
                >
                  <RefreshIcon />
                </IconButton>
              )
            )}
          </Stack>

          <Divider />
          <Autocomplete
            multiple
            // limitTags={4}
            id="tags-standard"
            value={emailRecipients}
            onChange={(event, newValue) => {
              handleOnChange(newValue);
            }}
            ListboxComponent={ListboxComponent}
            options={options}
            getOptionLabel={(option) => {
              // Value selected with enter, right from the input
              if (typeof option === "string") {
                return option;
              }
              // Add "xxx" option created dynamically
              if (option.inputValue) {
                return option.inputValue;
              }
              return option.workEmail;
            }}
            renderOption={(props, option, state) => [
              props,
              option,
              state.index,
            ]}
            renderTags={(tagValue, getTagProps) => {
              return tagValue.map((option, index) => {
                const props = { ...getTagProps({ index }) };
                const isFixed = fixedOptions.some(
                  (e) => e.workEmail === option.workEmail
                );
                return (
                  <Toolbar
                    sx={{
                      pl: "4px !important",
                      pr: "4px !important",
                      minHeight: "unset",
                    }}
                    title={option.workEmail}
                  >
                    <Chip
                      sx={{
                        borderRadius: "16px",
                        fontWeight: 500,
                        "& .MuiChip-avatar": {
                          width: 20,
                          height: 20,
                        },
                        "& .MuiChip-label": {
                          paddingLeft: 0.5,
                          paddingRight: 0.5,
                        },
                        gap: 1,
                        marginBottom: 0.25,
                      }}
                      clickable
                      onDelete={!isFixed && handleOnDelete(option)}
                      key={option.workEmail}
                      color={"secondary"}
                      avatar={
                        employeeMap[option.workEmail] &&
                        employeeMap[option.workEmail].employeeThumbnail ? (
                          <Avatar
                            size="small"
                            loading="lazy"
                            sx={{ width: 24, height: 24 }}
                            src={
                              employeeMap[option.workEmail].employeeThumbnail
                            }
                            alt={option.workEmail}
                          />
                        ) : (
                          <Avatar>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                        )
                      }
                      variant="outlined"
                      label={
                        employeeMap[option.workEmail] &&
                        employeeMap[option.workEmail].firstName &&
                        employeeMap[option.workEmail].lastName
                          ? employeeMap[option.workEmail].firstName +
                            " " +
                            employeeMap[option.workEmail].lastName
                          : option.workEmail
                      }
                    />
                  </Toolbar>
                );
              });
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            autoHighlight
            freeSolo
            filterOptions={(options, params) => {
              const filtered = filter(options, params);
              const { inputValue } = params;
              // Suggest the creation of a new value
              const isExisting = options.some(
                (option) => inputValue === option.title
              );
              if (inputValue !== "" && !isExisting) {
                filtered.push({
                  inputValue: `Add "${inputValue}"`,
                  workEmail: inputValue,
                });
              }

              return filtered;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder="Type or select"
              />
            )}
            // TODO: Post React 18 update - validate this conversion, look like a hidden bug
            renderGroup={(params) => params}
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #ddd",
          }}
        >
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="stretch"
            sx={{ width: "100%" }}
          >
            <Typography sx={{ padding: 1 }}>
              Additional Comment (Optional):
            </Typography>
            <AdditionalComment
              comment={comment}
              handleComment={handleComment}
            />
            <FormGroup sx={{ paddingLeft: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    color="secondary"
                    checked={isPublicComment}
                    onChange={handlePublicComment}
                  />
                }
                label="Public Comment"
              />
              <Typography variant="caption">
                {isPublicComment ? PUBLIC_EMAIL_TEXT : PRIVATE_EMAIL_TEXT}
              </Typography>
            </FormGroup>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default NotifyPeople;
