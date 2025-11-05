// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

const oneDay = 24 * 60 * 60 * 1000;

export function getCurrentYear() {
    return new Date().getFullYear();
}

export function getLocalDisplayDate(date) {
    return new Date(date).toLocaleDateString();

}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function arrangeDisplayDate(date) {
    var comma = ",";
    var position = 3;
    var output = [date.slice(0, position), comma, date.slice(position)].join('');

    return output;

};

export function getLocalDisplayDateWithTZReadable(date) {
    var localISOTime = "";
    var dateToBeUsed = new Date(date);
    if (isValidDate(dateToBeUsed)) {
        var tzoffset = (dateToBeUsed).getTimezoneOffset() * 60000; //offset in milliseconds
        localISOTime = arrangeDisplayDate((new Date(dateToBeUsed.getTime() - tzoffset)).toDateString());
    }

    return localISOTime;
}

export function getLocalDisplayDateReadable(date) {
    var dateToBeUsed = new Date(date);
    var dateToBeDisplayed = "";
    if(isValidDate(dateToBeUsed)){
        dateToBeDisplayed = arrangeDisplayDate(dateToBeUsed.toDateString())
    }
    return dateToBeDisplayed;
}

export function getDateFromTZString(date) {
    var index = date.indexOf('T');

    return date.substring(0, (index > 0 ? index : 0));
}

export function getDateFromDateObject(date) {
    return getDateFromDateString(date);
}

export function countDaysInRange(startDate, endDate) {
    return Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay) + 1)
}

/**
 * To format a date string to remove the timezone and return the date in dd/MM/yyyy format.
 * 01/01/2020 => 2020-01-01
 * @param {String} dateString
*/
export function getDateFromDateString(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

export function checkIfValidEmailAddress(email) {
    var re = /^[a-zA-Z][a-zA-Z0-9_\-\.]+@ws[o|0]2\.com$/;
    return re.test(email);
}


export function getUserFromEmail(email) {
    var index = email.indexOf('@');
    return email.substring(0, (index > 0 ? index : 0));
}

/**
 * To sort an array of employees or people using the 'workEmail' field
 * @param {Array} people 
 */
export function getSortedPeople(people) {
    var tempPeople = people.slice();
    //a and b are the elements n and n+1 passed in each iteration.
    tempPeople = tempPeople.sort((a, b) => {
        //Remove case sensitivity
        if (!a.workEmail || !b.workEmail) {
            return;
        }
        var emailA = a.workEmail.toUpperCase();
        var emailB = b.workEmail.toUpperCase();
        if (emailA < emailB) {
            return -1;
        }
        if (emailA > emailB) {
            return 1;
        }
        // names must be equal
        return 0;
    });
    return tempPeople;
};

/**
 * Reverse date string
 * @param {String} str 
 */
function flipDateString(str) {
    if (!str || !str.length) {
        return "";
    }

    return str.split("/").reverse().join("/");
};

export function getGmailMailTo(email, subject) {
    var urlToReturn = "https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=" + email
    if(subject){
        urlToReturn += "&su="+subject;
    }
    return urlToReturn;
};

export function getStartYear() {
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    return getDateFromDateObject(startDate);
}