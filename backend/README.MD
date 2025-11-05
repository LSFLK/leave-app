# Leave App API

## Overview

The Leave App API offers a streamlined and efficient solution for the management of employee leave within the organization. It facilitates the simplification of processes related to leave submission, viewing, and cancellation for employees. Additionally, the HR team benefits from exclusive administrative services, including reporting functionalities, made possible through meticulous user role and permission management. Both the Web App and the Micro App seamlessly integrate with this service as their backend infrastructure.

## Employee Services

- Leave Submission: Employees can utilize the app to submit their leave, specifying details such as the start date, end date, type of leave, and a brief comment if required.
  - Additionally creates a calendar event and generates an email notification upon submission.
  - Considers local holidays and previously submitted leave of an employee.
  - Provides the ability to notify required people.
- Leave Viewing: Employees can easily access and view their leave any time.
- Leave Cancellation: The app allows employees to cancel submitted leave when necessary, providing flexibility and responsiveness to changing circumstances.

## Admin Services

- Get the leave summary by employee or by a group of employees based on an advanced set of filters.

## Backend services used

This API uses a few backend services to provide the functionality mentioned in this document. They are as follows.

- HR Entity (GraphQL)
- Email Service (REST)
- Calendar Event Service (REST)

---

## API Definition

### Version: 2.1.0

### /form-data

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Get Application specific data required for initializing the leave form.

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
    "emailRecipients": [
        "user1@wso2.com",
        "user2@wso2.com"
    ],
    "leadEmails": [
        "user3@wso2.com"
    ],
    "location": "Sri Lanka",
    "legallyEntitledLeave": {
        "annual": 14.0,
        "casual": 7.0
    },
    "leaveReportContent": {
        "user@wso2.com": {
            "casual": 4.5,
            "total": 6.5,
            "totalExLieu": 5.5,
            "lieu": 1.0,
            "annual": 1.0
        }
    },
    "leaveTypes": [
        {
            "key": "casual",
            "value": "Other leave (Casual, Sick, etc.)"
        },
        {
            "key": "annual",
            "value": "Annual leave/PTO"
        },
        {
            "key": "paternity",
            "value": "Paternity leave"
        },
        {
            "key": "maternity",
            "value": "Maternity leave"
        },
        {
            "key": "lieu",
            "value": "Lieu leave"
        }
    ]
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /leaves

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Get leaves for the given filters.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>email</td>
<td>query</td>
<td>Email of the user to filter the leaves</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>startDate</td>
<td>query</td>
<td>Start date flter</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>endDate</td>
<td>query</td>
<td>End date flter</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>isActive</td>
<td>query</td>
<td>Whether to filter active or inactive leaves</td>
<td>No</td>
<td>boolean</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
    "leaves": [
        {
            "id": 100,
            "startDate": "2023-12-04T00:00:00Z",
            "endDate": "2023-12-04T00:00:00Z",
            "isActive": true,
            "leaveType": "lieu",
            "periodType": "half",
            "isMorningLeave": true,
            "email": "user@wso2.com",
            "createdDate": "2023-07-12T00:00:00Z",
            "emailRecipients": [],
            "numberOfDays": 0.5,
            "location": "Sri Lanka",
            "isCancelAllowed": true
        },
        {
            "id": 123,
            "startDate": "2023-12-01T00:00:00Z",
            "endDate": "2023-12-01T00:00:00Z",
            "isActive": true,
            "leaveType": "casual",
            "periodType": "half",
            "isMorningLeave": true,
            "email": "user@wso2.com",
            "createdDate": "2023-07-12T00:00:00Z",
            "emailRecipients": [],
            "numberOfDays": 0.5,
            "location": "Sri Lanka",
            "isCancelAllowed": true
        }
    ],
    "stats": [
        {
            "type": "lieu",
            "count": 0.5
        },
        {
            "type": "casual",
            "count": 0.5
        },
    ]
}
```
</td>
</tr>
<tr>
<td><span style="color: gold">403</span></td>
<td>Forbidden<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /leaves

#### <div style="background-color: #36b475; width: fit-content; padding: 5px; border-radius: 4px">POST</div>

#### Summary

Create a new leave.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>isValidationOnlyMode</td>
<td>query</td>
<td>Enable validation only mode to validate the leave without creating it</td>
<td>No</td>
<td>boolean</td>
</tr>
</tbody>
</table>

##### Request body
``application/json``

```json
{  
  "startDate": "2023-01-01",
  "endDate": "2023-01-01",
  "leaveType": "casual",
  "isMorningLeave": null,
  "periodType": "one",
  "calendarEventId": "1234",
  "comment": "Sample comment",
  "emailRecipients": [
    "user1@wso2.com"
  ],
  "isPublicComment": true
}
```

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>
<ul>
<li>

``isValidationOnlyMode: false`` or not specified
```json
{
  "message": "Leave submitted successfully"
}
```
</li>
<li>

``isValidationOnlyMode: true``
```json
{
    "workingDays": 2.0,
    "hasOverlap": false,
    "message": "Valid leave request"
}
```
</li>
</ul>

</td>
</tr>
<tr>
<td><span style="color: gold">400</span></td>
<td>BadRequest<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /leaves/{leaveId}

#### <div style="background-color: #fe523c; width: fit-content; padding: 5px; border-radius: 4px">DELETE</div>

#### Summary

Cancel a leave.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>leaveId</td>
<td>path</td>
<td>Leave ID</td>
<td>Yes</td>
<td>int</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
  "message": "Leave cancelled successfully"
}
```
</td>
</tr>
<tr>
<td><span style="color: gold">400</span></td>
<td>BadRequest<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
<tr>
<td><span style="color: gold">403</span></td>
<td>Forbidden<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /generate-report

#### <div style="background-color: #36b475; width: fit-content; padding: 5px; border-radius: 4px">POST</div>

#### Summary

Generate and fetch leave report.

#### Summary

``application/json``

```json 

{
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "businessUnit": "Corporate",
  "department": "DIGITAL TRANSFORMATION",
  "team": "INTERNAL APPS",
  "employeeStatuses": [
    "Active"
  ],
  "location": "Sri Lanka",
}
```

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
    "user1@wso2.com": {
        "casual": 6.5,
        "total": 13.0,
        "totalExLieu": 11.5,
        "lieu": 1.5,
        "annual": 5.0
    },
    "user2@wso2.com": {
        "casual": 2.0,
        "total": 2.0,
        "totalExLieu": 2.0
    }
}
```
      
</td>
    </tr>
    <tr>
      <td><span style="color: red">500</span></td>
      <td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /report-filters

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Fetch report filters required for the reports UI.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>employeeStatuses</td>
<td>query</td>
<td>Employee statuses to filter the employees</td>
<td>No</td>
<td>[ string ]</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
    "countries": [
        "Argentina",
        "Australia",
        "Brazil"
    ],
    "orgStructure": [
        {
            "name": "Corporate",
            "level": 0,
            "type": "bu",
            "typeName": "Business Unit",
            "children": [
                {
                    "name": "SALES",
                    "level": 1,
                    "type": "department",
                    "typeName": "Department",
                    "children": [
                        {
                            "name": "ME",
                            "level": 2,
                            "type": "team",
                            "typeName": "Team",
                            "children": []
                        },
                        {
                            "name": "ANZ",
                            "level": 2,
                            "type": "team",
                            "typeName": "Team",
                            "children": []
                        }
                    ]
                }
            ]
        }
    ],
    "flatList": [
        [
            "Corporate",
            "Integration-Software"
        ]
    ],
    "employeeStatuses": [
        "Marked leaver",
        "Active",
        "Left"
    ]
}
```
</td>
</tr>
<tr>
<td><span style="color: gold">400</span></td>
<td>BadRequest<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /employees

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Fetch all the employees.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>location</td>
<td>query</td>
<td>Employee location</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>businessUnit</td>
<td>query</td>
<td>Employee business unit</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>department</td>
<td>query</td>
<td>Employee department</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>team</td>
<td>query</td>
<td>Employee team</td>
<td>No</td>
<td>string</td>
</tr>
<tr>
<td>employeeStatuses</td>
<td>query</td>
<td>Employee statuses to filter the employees</td>
<td>No</td>
<td>[ string ]</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json

[
    {
        "firstName": "User First Name",
        "lastName": "User Last Name",
        "workEmail": "user@wso2.com",
        "employeeThumbnail": "",
        "location": "Sri Lanka"
    }
]
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /employees/{email}

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Fetch an employee by email.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>email</td>
<td>path</td>
<td>Employee email</td>
<td>Yes</td>
<td>string</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
  "firstName": "User",
  "lastName": "Name",
  "workEmail": "user@wso2.com",
  "employeeThumbnail": "",
  "location": "Sri Lanka"
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /user-calendar

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Fetch user calendar.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>startDate</td>
<td>query</td>
<td>Start date of the calendar </td>
<td>Yes</td>
<td>string</td>
</tr>
<tr>
<td>endDate</td>
<td>query</td>
<td>End date of the calendar</td>
<td>Yes</td>
<td>string</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json
{
    "leaves": [
        {
            "id": 123,
            "startDate": "2023-11-02T00:00:00Z",
            "endDate": "2023-11-02T00:00:00Z",
            "isActive": true,
            "leaveType": "casual",
            "periodType": "half",
            "isMorningLeave": true,
            "email": "user@wso2.com",
            "createdDate": "2023-07-21T00:00:00Z",
            "emailRecipients": [],
            "numberOfDays": 0.5,
            "location": "Sri Lanka",
            "isCancelAllowed": true
        }
    ],
    "holidays": [
        {
            "title": "December 2023 Holidays - All Offices",
            "date": "2023-12-23T00:00:00Z"
        }
    ]
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
<br/>

### /employees/{email}/leave-entitlement

#### <div style="background-color: #0095ff; width: fit-content; padding: 5px; border-radius: 4px">GET</div>

#### Summary

Fetch legally entitled leave for the given employee.

##### Parameters

<table>
<thead>
<tr>
<th>Name</th>
<th>Located in</th>
<th>Description</th>
<th>Required</th>
<th>Schema</th>
</tr>
</thead>
<tbody>
<tr>
<td>email</td>
<td>path</td>
<td>Employee email</td>
<td>Yes</td>
<td>string</td>
</tr>
<tr>
<td>years</td>
<td>query</td>
<td>Years to fetch leave entitlement. Empty array will fetch leave entitlement for the current year</td>
<td>No</td>
<td>[ int ]</td>
</tr>
</tbody>
</table>

##### Responses

<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><span style="color: green">200</span></td>
<td>Ok<br/>

```json

[
    {
        "year": 2023,
        "location": "Sri Lanka",
        "leavePolicy": {
            "annual": 14.0,
            "casual": 7.0
        },
        "policyAdjustedLeave": {
            "annual": 0.0,
            "casual": 4.5
        }
    }
]
```
</td>
</tr>
<tr>
<td><span style="color: gold">403</span></td>
<td>Forbidden<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
<tr>
<td><span style="color: red">500</span></td>
<td>InternalServerError<br/>

```json
{
  "message": "Error message"
}
```
</td>
</tr>
</tbody>
</table>
