#Application service for the leave app admin application.

This contains the Ballerina API for the admin application services for the leave app. User and Admin features needs to be enabled automatically by using RBAC.

##Admin Services needs to facilitate for following functionalities in the Web App/MicroApp.
- Get the leave summary by employee
- Calculate number of working days per date range, per employee based on employee's country
- Get parameters for the leave submission form
- Submit leave request
- Cancel leave request
- Get list of holidays for each country (nice to have feature in the leave app or have another MicroApp to show Holidays)


##Admin Services needs to facilitate for following functionalities in the Web App/MicroApp.
- Get form parameters for the reporting application
- Generate leave reports by Country/BU/Department/Tem
- Generate leave reports by employee
- Manage holidays for each Country