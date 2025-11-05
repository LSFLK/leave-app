import { LEAVE_APP, SRI_LANKA } from "../constants";
import { getCountry } from "./oauth";

export const getLeaveTypes = () => {
  const country = getCountry();
  if (country === SRI_LANKA) {
    return Object.values(LEAVE_APP.LEAVE_TYPES).filter(
      (e) =>
        !(
          e.countryRestriction &&
          e.countryRestriction[country] &&
          !e.countryRestriction[country].enabled
        )
    );
  }

  return Object.values(LEAVE_APP.LEAVE_TYPES);
};

export const getLeaveTypeTitle = (leaveType) => {
  var leaveTypeTitle = LEAVE_APP.LEAVE_TYPES[leaveType]
    ? LEAVE_APP.LEAVE_TYPES[leaveType].title
    : "";
  const country = getCountry();
  if (country === SRI_LANKA) {
    var countryRestrictionTitle = LEAVE_APP.LEAVE_TYPES[leaveType]
      ? LEAVE_APP.LEAVE_TYPES[leaveType].countryRestriction &&
        LEAVE_APP.LEAVE_TYPES[leaveType].countryRestriction[country]
        ? LEAVE_APP.LEAVE_TYPES[leaveType].countryRestriction[country].title
        : leaveTypeTitle
      : leaveTypeTitle;
    return countryRestrictionTitle;
  }

  return leaveTypeTitle;
};

export const sickLeaveExceptionHandler = (leave) => {
  if (
    leave.type === "sick" ||
    leave.leaveType === `sick` ||
    leave.key === "sick"
  ) {
    return {
      ...leave,
      type: "casual",
      leaveType: "casual",
      key: "casual",
      value: isNaN(leave.value)
        ? LEAVE_APP.LEAVE_TYPES.casual.title
        : leave.value,
      label: LEAVE_APP.LEAVE_TYPES.casual.title,
      name: LEAVE_APP.LEAVE_TYPES.casual.title,
    };
  }

  return leave;
};

// Function to handle the very specific change to merge annual and casual leaves to one. This is effective for only LK employees.
export const annualLeaveLkEmployeeHandler = (leave) => {
  const country = getCountry();
  if (
    country === SRI_LANKA &&
    (leave.type === "annual" ||
      leave.leaveType === `annual` ||
      leave.key === "annual")
  ) {
    return {
      ...leave,
      type: "casual",
      leaveType: "casual",
      key: "casual",
      value: isNaN(leave.value)
        ? LEAVE_APP.LEAVE_TYPES.casual.title
        : leave.value,
      label: LEAVE_APP.LEAVE_TYPES.casual.title,
      name: LEAVE_APP.LEAVE_TYPES.casual.title,
    };
  }

  return leave;
};

// Function to get start date of this year
export const getStartDateOfThisYear = () => {
  var date = new Date();
  return new Date(date.getFullYear(), 0, 1);
};

// Function to get end date of this year
export const getEndDateOfThisYear = () => {
  var date = new Date();
  return new Date(date.getFullYear(), 11, 31);
};

// Function to get all years between two dates
export const getYearsBetweenDateRange = (startDate, endDate) => {
  var years = [];
  var startYear = new Date(startDate).getFullYear();
  var endYear = new Date(endDate).getFullYear();
  for (var i = startYear; i <= endYear; i++) {
    years.push(i);
  }
  return years;
};

export function getEmailFromJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    return payload.email || payload.sub || null;
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
}
