// ==============================
// DB Functions Module
// ==============================
// Provides helper functions for interacting with the Payslip database:
// - initDB: Creates the payslip table if it doesn't exist
// - insertPayslip: Inserts or updates a payslip record
// - fetchLatestPayslip: Retrieves the latest payslip for an employee
// - fetchAllPayslips: Retrieves all payslip records
// - stopHandler: Gracefully closes the database client
// ==============================

import ballerina/sql;
import ballerinax/mysql.driver as _; // bundle driver


// Initializes the payslip table if it doesn't already exist
public function initDB() returns error? {
    // Create leaves table only
    _ = check databaseClient->execute(`
        CREATE TABLE IF NOT EXISTS leaves (
            leave_id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            leave_type VARCHAR(64) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reason VARCHAR(512),
            status VARCHAR(32) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create users table with two columns: email & user_role
    // Note: Using 'user_role' to avoid reserved keyword conflicts in MySQL
    _ = check databaseClient->execute(`
        CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(255) NOT NULL PRIMARY KEY,
            user_role VARCHAR(64) NOT NULL
        )
    `);
}



// Fetch a single user by email from the users table
public isolated function fetchUserByEmail(string email)
        returns record {| string email; string user_role; |}?|error {
    sql:ParameterizedQuery pq = `SELECT email, user_role FROM users WHERE email = ${email} LIMIT 1`;

    stream<record {| string email; string user_role; |}, error?> resultStream = databaseClient->query(pq);

    record {| string email; string user_role; |}? user = ();
    var next = resultStream.next();
    if next is record {| record {| string email; string user_role; |} value; |} {
        user = next.value;
    } else if next is error {
        return next;
    }
    return user; // () if not found
}

// Insert a new leave request into the leaves table
public isolated function insertLeave(
    string leave_id,
    string user_id,
    string leave_type,
    string start_date,
    string end_date,
    string reason,
    string status
) returns error? {
    sql:ParameterizedQuery pq = `INSERT INTO leaves
        (leave_id, user_id, leave_type, start_date, end_date, reason, status, created_at)
        VALUES (${leave_id}, ${user_id}, ${leave_type}, ${start_date}, ${end_date}, ${reason}, ${status}, CURRENT_TIMESTAMP)`;
    _ = check databaseClient->execute(pq);
}

// Fetch all leaves for a user filtered by status
// Fetch all leaves for a given user and status
public isolated function fetchLeavesByUserAndStatus(string userId)
        returns record {| 
            string leave_id;
            string user_id;
            string leave_type;
            string start_date;
            string end_date;
            string reason;
            string status;
            string created_at;
        |}[]|error {

    sql:ParameterizedQuery pq = `SELECT 
                leave_id, 
                user_id, 
                leave_type, 
                start_date, 
                end_date, 
                reason, 
                status, 
                created_at 
            FROM leaves
            WHERE user_id = ${userId}`;

    // Query the database and return all matching rows as an array
    stream<record {| 
        string leave_id; 
        string user_id; 
        string leave_type; 
        string start_date; 
        string end_date; 
        string reason; 
        string status; 
        string created_at; 
    |}, error?> resultStream = databaseClient->query(pq);

    // Collect the stream into an array
    record {| 
        string leave_id; 
        string user_id; 
        string leave_type; 
        string start_date; 
        string end_date; 
        string reason; 
        string status; 
        string created_at; 
    |}[] results = [];

    // Iterate through the stream and add to results array
    while true {
        var next = resultStream.next();
        if next is record {| record {| 
            string leave_id; 
            string user_id; 
            string leave_type; 
            string start_date; 
            string end_date; 
            string reason; 
            string status; 
            string created_at; 
        |} value; |} {
            results.push(next.value);
        } else if next is error {
            return next;
        } else {
            break;
        }
    }

    return results;
}

// Fetch leaves across all users with optional filters (admin reporting)
// Fetch all leaves (admin); service layer can filter
public isolated function fetchAllLeavesDB()
        returns record {| 
            string leave_id;
            string user_id;
            string leave_type;
            string start_date;
            string end_date;
            string reason;
            string status;
            string created_at;
        |}[]|error {
    sql:ParameterizedQuery pq = `SELECT 
                leave_id, 
                user_id, 
                leave_type, 
                start_date, 
                end_date, 
                reason, 
                status, 
                created_at 
            FROM leaves`;

    stream<record {| 
        string leave_id; 
        string user_id; 
        string leave_type; 
        string start_date; 
        string end_date; 
        string reason; 
        string status; 
        string created_at; 
    |}, error?> resultStream = databaseClient->query(pq);

    record {| 
        string leave_id; 
        string user_id; 
        string leave_type; 
        string start_date; 
        string end_date; 
        string reason; 
        string status; 
        string created_at; 
    |}[] results = [];

    while true {
        var next = resultStream.next();
        if next is record {| record {| 
            string leave_id; 
            string user_id; 
            string leave_type; 
            string start_date; 
            string end_date; 
            string reason; 
            string status; 
            string created_at; 
        |} value; |} {
            results.push(next.value);
        } else if next is error {
            return next;
        } else {
            break;
        }
    }

    return results;
}

    // Fetch leaves by period and type
    public isolated function fetchLeavesByPeriodAndType(string startDate, string endDate, string leaveType)
            returns record {| 
                string leave_id;
                string user_id;
                string leave_type;
                string start_date;
                string end_date;
                string reason;
                string status;
                string created_at;
            |}[]|error {
        sql:ParameterizedQuery pq = `SELECT 
                    leave_id, 
                    user_id, 
                    leave_type, 
                    start_date, 
                    end_date, 
                    reason, 
                    status, 
                    created_at 
                FROM leaves
                WHERE leave_type = ${leaveType} AND start_date >= ${startDate} AND end_date <= ${endDate}`;

        stream<record {| 
            string leave_id; 
            string user_id; 
            string leave_type; 
            string start_date; 
            string end_date; 
            string reason; 
            string status; 
            string created_at; 
        |}, error?> resultStream = databaseClient->query(pq);

        record {| 
            string leave_id; 
            string user_id; 
            string leave_type; 
            string start_date; 
            string end_date; 
            string reason; 
            string status; 
            string created_at; 
        |}[] results = [];

        while true {
            var next = resultStream.next();
            if next is record {| record {| 
                string leave_id; 
                string user_id; 
                string leave_type; 
                string start_date; 
                string end_date; 
                string reason; 
                string status; 
                string created_at; 
            |} value; |} {
                results.push(next.value);
            } else if next is error {
                return next;
            } else {
                break;
            }
        }

        return results;
    }
    // Update leave status by leave_id
    public isolated function updateLeaveStatusDB(string leaveId, string newStatus) returns error? {
        sql:ParameterizedQuery pq = `UPDATE leaves SET status = ${newStatus} WHERE leave_id = ${leaveId}`;
        _ = check databaseClient->execute(pq);
    }

// Delete a leave for a specific user (ensures user owns the leave)
public isolated function deleteLeaveDB(string leaveId, string userId) returns error? {
    sql:ParameterizedQuery pq = `DELETE FROM leaves WHERE leave_id = ${leaveId} AND user_id = ${userId}`;
    _ = check databaseClient->execute(pq);
}

// Admin delete (no user restriction)
public isolated function adminDeleteLeaveDB(string leaveId) returns error? {
    sql:ParameterizedQuery pq = `DELETE FROM leaves WHERE leave_id = ${leaveId}`;
    _ = check databaseClient->execute(pq);
}

// Fetch all leaves filtered by status (for admin dashboard)
public isolated function fetchLeavesByStatusDB(string status)
        returns record {| 
            string leave_id;
            string user_id;
            string leave_type;
            string start_date;
            string end_date;
            string reason;
            string status;
            string created_at;
        |}[]|error {

    sql:ParameterizedQuery pq = `SELECT 
                leave_id, 
                user_id, 
                leave_type, 
                start_date, 
                end_date, 
                reason, 
                status, 
                created_at 
            FROM leaves
            WHERE status = ${status}`;

    stream<record {| 
        string leave_id; 
        string user_id; 
        string leave_type; 
        string start_date; 
        string end_date; 
        string reason; 
        string status; 
        string created_at; 
    |}, error?> resultStream = databaseClient->query(pq);

    record {| 
        string leave_id; 
        string user_id; 
        string leave_type; 
        string start_date; 
        string end_date; 
        string reason; 
        string status; 
        string created_at; 
    |}[] results = [];

    while true {
        var next = resultStream.next();
        if next is record {| record {| 
            string leave_id; 
            string user_id; 
            string leave_type; 
            string start_date; 
            string end_date; 
            string reason; 
            string status; 
            string created_at; 
        |} value; |} {
            results.push(next.value);
        } else if next is error {
            return next;
        } else {
            break;
        }
    }

    return results;
}

