import React, { useEffect } from "react";
import CalendarIcon from "react-calendar-icon";
import { ThemeProvider } from "@emotion/react";
import { useTheme } from "@mui/material";

const dateOptions = {
  header: { month: "long" },
  // footer: { month: "short" },
  value: { day: "2-digit" },
  locale: []
};

export default function Calendar(props) {
  const theme = useTheme();
  const {date} = props;
  const calendarTheme = {
    calendarIcon: {
      textColor: "white", // text color of the header and footer
      primaryColor: theme.palette.secondary.main, // background of the header and footer
      backgroundColor: "#fafafa",
    },
    value: {
      marginRight: 100,
    }
  };

  useEffect(()=>{

  },[date]);

  return (
    <ThemeProvider theme={calendarTheme}>
      <CalendarIcon date={new Date(date)} options={dateOptions}/>
    </ThemeProvider>
  );
}