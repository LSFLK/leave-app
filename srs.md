# Software Requirements Specification (SRS)

## Leave Management System (User Web App + Admin Portal)

**Technologies:**

- **Frontend (Web):** Vite + React
- **Backend:** Ballerina
- **Database:** MySQL
- **Deployment:** Choreo
- **API Integration:** RESTful APIs built in Ballerina

---

## 1. Introduction

### 1.1 Purpose

This document specifies the requirements for the Leave Management System, which enables employees to submit leave requests via a web app and allows administrators to manage, approve, or reject those requests through a web-based admin portal. The system also provides reporting functionalities for both users and administrators, offering summarized data about leave types, durations, and statuses.

### 1.2 Scope

The system includes:

- **User Web App:** Employees apply for leave, view status, and generate personal leave reports.
- **Admin Portal:** Administrators view, approve, or reject leave requests and generate organizational reports.
- **Backend Service (Ballerina):** Handles business logic, database operations, and API communication.
- **Database:** leave records, and approval statuses.

**Key Features:**

- User authentication and authorization
- Leave request management
- Real-time synchronization between user app and admin portal
- Report generation and data export

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition                          |
| ---- | ----------------------------------- |
| SRS  | Software Requirements Specification |
| UI   | User Interface                      |
| API  | Application Programming Interface   |
| DB   | Database                            |
| CRUD | Create, Read, Update, Delete        |

### 1.4 References

- [Ballerina official documentation](https://ballerina.io/learn/)
- [Vite + React documentation](https://vitejs.dev/)

---

## 2. Overall Description

### 2.1 Product Perspective

This is a two-sided client-server application:

```
+-----------------+       +------------------+       +------------------+
|  User Web App   | <---> | Ballerina Backend| <---> |   Database (SQL) |
+-----------------+       +------------------+       +------------------+
                                   ^
        __________________________ |
        v
+----------------+
|  Admin Portal  |
+----------------+
```

- **Frontend:** Vite apps communicate with Ballerina backend via RESTful APIs.
- **Backend:** Ballerina interacts with the relational database to persist leave data.

### 2.2 Product Functions

#### A. User Web App

- Login / Logout
- Apply for leave (select type, select portion of day, date range, reason, select people/groups to notify, additional comments(optional))
- View applied leave history
- View current leave status (Pending, Approved, Rejected)
- Edit or cancel pending leave
- Generate leave report by date range or type

#### B. Admin Portal

- Admin login
- Dashboard view: all pending leaves
- Approve or disapprove leaves
- Filter leaves by status, user, or date
- Generate reports for all employees or a selected employee
- Export reports (PDF/CSV)

#### C. Backend (Ballerina)

- REST API endpoints for user and admin
- Database integration (SQL)
- Authentication and session management
- Business rules for leave approval workflow
- Reporting logic and data aggregation

### 2.3 User Classes and Characteristics

| User Type     | Description                                             | Access           |
| ------------- | ------------------------------------------------------- | ---------------- |
| Employee/User | Registered employee using the web app to submit leaves | Web App          |
| Admin         | HR/admin staff who review and approve leaves            | Admin Web Portal |

### 2.4 Operating Environment

| Component    | Technology       | Environment |
| ------------ | ---------------- | ----------- |
| Web App      | Vite + React     | Web browser |
| Admin Portal | Vite + React     | Web browser |
| Backend      | Ballerina        | Cloud/local |
| Database     | MySQL/PostgreSQL | Cloud/local |

### 2.5 Design and Implementation Constraints

- Backend must be written in Ballerina.
- Frontend must use Vite.
- Database should use SQL schema.
- API communication via REST and JSON.
- Secure authentication (JWT or session tokens).

### 2.6 Assumptions and Dependencies

- Internet connectivity is available.
- User data is already available or registered in the system.
- Admin rights are assigned manually via database or configuration.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 User Authentication

- **FR1.1:** Uses JWT/session tokens for authentication.

#### 3.1.2 Leave Application (User)

- **FR2.1:** User can submit a leave request with:
  - Leave type (Annual, Sick, Casual, etc.)
  - Start date, end date
  - Reason
  - Porttion of the day
  - People/Groups to notify
  - Additional comment(optional)
- **FR2.2:** Request is stored in the database with status = "Pending".
- **FR2.3:** System validates date ranges to prevent overlaps.

#### 3.1.3 Leave Management (Admin)

- **FR3.1:** Admin views all pending leaves in a dashboard.
- **FR3.2:** Admin can approve or reject any leave request.
- **FR3.3:** Decision (Approved/Rejected) updates the leave record in the database.
- **FR3.4:** Status immediately reflects in the user’s web app.

#### 3.1.4 Reporting (User)

- **FR4.1:** User can view their leave history.
- **FR4.2:** User can generate reports for:
  - Specific period
  - Leave type
  - Total days taken vs remaining
- **FR4.3:** Report can be exported in PDF or CSV format.

#### 3.1.5 Reporting (Admin)

- **FR5.1:** Admin can generate organization-wide leave summaries.
- **FR5.2:** Admin can filter reports by:
  - Date range
  - Employee
  - Leave type/status
- **FR5.3:** Admin can export reports as PDF/CSV.

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance

- Backend must respond to API requests within 500 ms under normal load.
- System should support at least 100 concurrent users.

#### 3.2.2 Security

- All communication must use HTTPS.
- Passwords must be encrypted (bcrypt/argon2).
- JWT tokens must expire after a defined session time.

#### 3.2.3 Reliability

- System must ensure data consistency even if a network interruption occurs during submission.

#### 3.2.4 Usability

- Web UI must be simple and user-friendly.
- Admin Portal must support responsive design.

#### 3.2.5 Scalability

- System must be easily extendable to support additional user roles (e.g., Manager).

#### 3.2.6 Availability

- System uptime should be at least 99%.

#### 3.2.7 Maintainability

- Backend code should be modular with clear API structure.
- Logging and error handling must be implemented.

### 3.3 Database Schema (Example)

#### Tables

**leaves**

- leave_id (PK)
- user_id
- leave_type
- start_date
- end_date
- reason
- status (Pending/Approved/Rejected)
- created_at

### 3.4 API Endpoints (Sample)

| Endpoint                 | Method | Description                       |
| ------------------------ | ------ | --------------------------------- |
| /api/auth/login          | POST   | Authenticate user                 |
| /api/leaves              | POST   | Submit new leave                  |
| /api/leaves/user/{id}    | GET    | Get leaves for a specific user    |
| /api/leaves/pending      | GET    | Get all pending leaves (admin)    |
| /api/leaves/{id}/approve | PUT    | Approve leave                     |
| /api/leaves/{id}/reject  | PUT    | Reject leave                      |
| /api/reports/user/{id}   | GET    | Generate user report              |
| /api/reports/admin       | GET    | Generate organization-wide report |

---

## 4. System Features Summary

| Feature                | User App | Admin Portal |
| ---------------------- | :------: | :----------: |
| Login / Auth           |    ✅    |      ✅      |
| Apply for Leave        |    ✅    |      ❌      |
| Approve / Reject Leave |    ❌    |      ✅      |
| View Leave History     |    ✅    |      ✅      |
| Report Generation      |    ✅    |      ✅      |
| Dashboard              |    ❌    |      ✅      |

---

## 5. Future Enhancements

- User should not be able to add sprevious dates as tart & end date
- Start date must be before the end date
- Push notifications for leave approval/rejection.
- Multi-level approval (Manager → HR → Admin).
- Integration with email/calendar systems.
- Role-based dashboards.

---

## 6. Appendices

- **Tools used:** Vite, React, Ballerina, MySQL, Tailwind CSS.
- **Deployment:** Using Choreo.
- **Testing:** Unit & integration tests using Vitest (frontend) and Ballerina Test framework.
