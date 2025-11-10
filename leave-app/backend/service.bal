import ballerina/http;
import ballerina/log;
import ballerina/io;

 

// ==============================
// Payslip microapp Backend Service
// ==============================
// Handles payslip management including:
// - JWT-protected resource endpoints
// - CSV upload for bulk payslip insertion
// - Fetching single or all payslips
// - Admin-specific endpoints
// - Health check endpoints
// - CORS configuration and error interception
// ==============================

// Leave request payload type
public type LeavePayload record {| 
    string leave_id;
    string user_id;
    string leave_type;
    string start_date;
    string end_date;
    string reason;
    string status;
    string? portion_of_day = ();
    string[]? notify_people = ();
    string? additional_comment = ();
|};

// Minimal payload type for approve/reject
type LeaveIdOnly record {| string leave_id; |};
// Payload for editing a leave
type LeaveUpdatePayload record {| 
    string leave_type;
    string start_date;
    string end_date;
    string? reason = ();
|};

configurable int serverPort = 9090;

// Interceptor for logging and custom error handling
service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        if err is http:PayloadBindingError {
            string customError = "Payload binding failed!";
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}
            // Helper: Generate leave report (total days taken vs remaining)
            type LeaveTotals record {|
                int taken;
                int remaining;
            |};
            
                        function generateLeaveReport(string? startDate, string? endDate, string? leaveType) returns json|error {
                            // Handle nullable values for startDate, endDate, leaveType
                            string sDate = startDate ?: "";
                            string eDate = endDate ?: "";
                            string lType = leaveType ?: "";
                            var leavesResult = fetchLeavesByPeriodAndType(sDate, eDate, lType);
                            if leavesResult is error {
                                return leavesResult;
                            }
                            // Calculate totals by leave type
                            map<LeaveTotals> totals = {};
                            int totalTaken = 0;
                            int totalRemaining = 0;
                            foreach var leave in leavesResult {
                                string leaveTypeVal = leave.leave_type;
                                if !totals.hasKey(leaveTypeVal) {
                                    totals[leaveTypeVal] = {taken: 0, remaining: 0};
                                }
                                LeaveTotals tempTotals = totals[leaveTypeVal] ?: {taken: 0, remaining: 0};
                                tempTotals.taken = tempTotals.taken + 1;
                                totals[leaveTypeVal] = tempTotals;
                                // For demo: assume 20 days entitlement per type
                                if totals[leaveTypeVal] is LeaveTotals {
                                    totals[leaveTypeVal] = {
                                        taken: totals[leaveTypeVal]?.taken ?: 0,
                                        remaining: 20 - (totals[leaveTypeVal]?.taken ?: 0)
                                    };
                                }
                                totalTaken += 1;
                            }
                            totalRemaining = (totals.length() * 20) - totalTaken;
                            return {"totals": totals, "totalTaken": totalTaken, "totalRemaining": totalRemaining, "leaves": leavesResult};
                        }

            
            // // Helper: Export report as CSV
            // function exportReportAsCSV(json report) returns byte[]|error {
            //     string csv = "Leave Type,Taken,Remaining\n";
            //     foreach var lType in report["totals"].keys() {
            //         var data = report["totals"][lType];
            //         csv += lType + "," + data["taken"].toString() + "," + data["remaining"].toString() + "\n";
            //     }
            //     return csv.toBytes();
            // }

            // Helper: Export report as PDF (stub, returns CSV as bytes for now)
        // function exportReportAsPDF(json report) returns byte[]|error {
        //     // For demo, just return CSV bytes. Replace with PDF generation logic if needed.
        //     return exportReportAsCSV(report);
        // }

// CORS configuration for frontend access
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowCredentials: false,
        allowHeaders: ["Authorization", "Content-Type", "x-jwt-assertion"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
service http:InterceptableService / on new http:Listener(serverPort) {

    // Attach interceptors for error handling and JWT validation
    public function createInterceptors() returns http:Interceptor[] =>
    [new ErrorInterceptor(), new JwtInterceptor()];

    // Service initialization: setup DB, log startup, register graceful shutdown
    public function init() returns error? {
        check initDB();
        io:println("Initializing the microapp backend service...");
        //runtime:onGracefulStop(stopHandler);
    }

    // // GET single payslip for authenticated employee
    // resource function get payslip(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
    //     string|error empId = ctx.getWithType("emp_id");
    //     if empId is error {
    //         check caller->respond({
    //             status: "error",
    //             message: "Invalid request: emp_id missing in JWT",
    //             errorCode: "UNAUTHORIZED"
    //         });
    //         return;
    //     }

    //     Payslip|error row = fetchLatestPayslip(empId);
    //     if row is Payslip {
    //         check caller->respond(row);
    //     } else {
    //         return row;
    //     }
    // }

    // GET /api/admin/leaves/pending - Admin views all pending leaves
    resource function get api/admin/leaves/pending(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        // Role guard: only admins can access
        string|error userEmail = ctx.getWithType("email");
        
        if userEmail is error {
            check caller->respond({"status":"error","message":"Unauthorized: missing user","code":403});
            return;
        }
        var userRow = fetchUserByEmail(userEmail);
        if userRow is error {
            check caller->respond({"status":"error","message":"Failed to verify role","error":userRow.toString()});
            return;
        }
        if userRow is () || userRow?.user_role.toLowerAscii() != "admin" {
            check caller->respond({"status":"error","message":"Forbidden: admin only","code":403});
            return;
        }
        // Use typed mapper to convert DB rows to LeavePayload
        LeavePayload[]|error leavesResult = fetchLeavesByStatus("pending");
        if leavesResult is error {
            check caller->respond({
                "status": "error",
                "message": "Failed to fetch pending leaves",
                "error": leavesResult.toString()
            });
            return;
        }
        check caller->respond({
            "status": "success",
            "message": "Fetched all pending leaves",
            "count": leavesResult.length(),
            "data": leavesResult
        });
    }

    // GET /api/admin/leaves - Admin org-wide leaves with optional filters
    resource function get api/admin/leaves(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        // Role guard: only admins can access
        string|error userEmail = ctx.getWithType("email");
        //string|error userEmail = "sarah@gov.com";
        if userEmail is error {
            check caller->respond({"status":"error","message":"Unauthorized: missing user","code":403});
            return;
        }
        var userRow = fetchUserByEmail(userEmail);
        if userRow is error {
            check caller->respond({"status":"error","message":"Failed to verify role","error":userRow.toString()});
            return;
        }
        if userRow is () || userRow?.user_role.toLowerAscii() != "admin" {
            check caller->respond({"status":"error","message":"Forbidden: admin only","code":403});
            return;
        }

        // Read query params
        string? startDate = req.getQueryParamValue("start");
        string? endDate = req.getQueryParamValue("end");
        string? employee = req.getQueryParamValue("employee");
        string? leaveType = req.getQueryParamValue("type");
        string? status = req.getQueryParamValue("status");

    var allRes = fetchAllLeavesDB();
    if allRes is error {
            check caller->respond({
                "status": "error",
                "message": "Failed to fetch leaves",
        "error": allRes.toString()
            });
            return;
        }

    LeavePayload[] leaves = [];
    foreach var row in allRes {
        // Filters
        if employee is string && employee.trim() != "" && row.user_id.toLowerAscii() != employee.toLowerAscii() { continue; }
        if leaveType is string && leaveType.trim() != "" && leaveType != "all" && row.leave_type != leaveType { continue; }
        if status is string && status.trim() != "" && status != "all" && row.status != status { continue; }
        if startDate is string && startDate.trim() != "" && row.end_date < startDate { continue; }
        if endDate is string && endDate.trim() != "" && row.start_date > endDate { continue; }
            leaves.push({
                leave_id: row.leave_id,
                user_id: row.user_id,
                leave_type: row.leave_type,
                start_date: row.start_date,
                end_date: row.end_date,
                reason: row.reason,
                status: row.status
            });
        }
        check caller->respond({
            "status": "success",
            "message": "Fetched leaves",
            "count": leaves.length(),
            "data": leaves
        });
    }

        // POST /api/admin/leaves/approve - Admin approves a leave request
        resource function post api/admin/leaves/approve(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
            // Role guard
            string|error userEmail = ctx.getWithType("email");
            if userEmail is error {
                return caller->respond({"status":"error","message":"Unauthorized: missing user","code":403});
            }
            var userRow = fetchUserByEmail(userEmail);
            if userRow is error {
                return caller->respond({"status":"error","message":"Failed to verify role","error":userRow.toString()});
            }
            if userRow is () || userRow?.user_role.toLowerAscii() != "admin" {
                return caller->respond({"status":"error","message":"Forbidden: admin only","code":403});
            }
            json|error payloadJson = req.getJsonPayload();
            if payloadJson is error {
                return caller->respond({
                    "status": "error",
                    "message": "Invalid JSON payload",
                    "error": payloadJson.toString()
                });
            }
            LeaveIdOnly|error idReq = payloadJson.cloneWithType(LeaveIdOnly);
            if idReq is error {
                return caller->respond({"status":"error","message":"leave_id is required"});
            }
            string leaveId = idReq.leave_id;
            error? dbResult = updateLeaveStatus(leaveId, "approved");
            if dbResult is error {
                return caller->respond({
                    "status": "error",
                    "message": "Failed to approve leave",
                    "error": dbResult.toString()
                });
            }
            return caller->respond({
                "status": "success",
                "message": "Leave request approved"
            });
        }

        // POST /api/admin/leaves/reject - Admin rejects a leave request
        resource function post api/admin/leaves/reject(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
            // Role guard
            string|error userEmail = ctx.getWithType("email");
            if userEmail is error {
                return caller->respond({"status":"error","message":"Unauthorized: missing user","code":403});
            }
            var userRow = fetchUserByEmail(userEmail);
            if userRow is error {
                return caller->respond({"status":"error","message":"Failed to verify role","error":userRow.toString()});
            }
            if userRow is () || userRow?.user_role.toLowerAscii() != "admin" {
                return caller->respond({"status":"error","message":"Forbidden: admin only","code":403});
            }
            json|error payloadJson = req.getJsonPayload();
            if payloadJson is error {
                return caller->respond({
                    "status": "error",
                    "message": "Invalid JSON payload",
                    "error": payloadJson.toString()
                });
            }
            LeaveIdOnly|error idReq2 = payloadJson.cloneWithType(LeaveIdOnly);
            if idReq2 is error {
                return caller->respond({"status":"error","message":"leave_id is required"});
            }
            string leaveId = idReq2.leave_id;
            error? dbResult = updateLeaveStatus(leaveId, "rejected");
            if dbResult is error {
                return caller->respond({
                    "status": "error",
                    "message": "Failed to reject leave",
                    "error": dbResult.toString()
                });
            }
            return caller->respond({
                "status": "success",
                "message": "Leave request rejected"
            });
    }
    // resource function get all() returns json|error {
    //     Payslip[]|error rows = fetchAllPayslips();
    //     if rows is error {
    //         return rows;
    //     }

    //     return {
    //         status: "success",
    //         message: "Fetched payslips from database",
    //         count: rows.length(),
    //         data: rows
    //     };
    // }


    // // GET all payslips for admin portal
    // resource function get admin\-portal/all() returns json|error {
    //     Payslip[]|error rows = fetchAllPayslips();
    //     if rows is error {
    //         return rows;
    //     }

    //     return {
    //         status: "success",
    //         message: "Fetched payslips from database",
    //         count: rows.length(),
    //         data: rows
    //     };
    // }

    // // POST CSV upload to insert multiple payslips
    // resource function post admin\-portal/upload(http:Request req) returns json|error {
    //     check ensureDatabaseSelected();

    //     mime:Entity|error fileEntity = req.getEntity();
    //     if fileEntity is error {
    //         return <json>{ "error": "No file uploaded" };
    //     }

    //     string tempCsvPath = "/tmp/uploaded.csv";
    //     byte[] fileContent = check fileEntity.getByteArray();
    //     check io:fileWriteBytes(tempCsvPath, fileContent);

    //     stream<string[], io:Error?> csvStream = check io:fileReadCsvAsStream(tempCsvPath);

    //     int processed = 0;
    //     int skipped = 0;
    //     int errors = 0;

    //     check csvStream.forEach(function(string[] row) {
    //         if row.length() == 0 || (row.length() == 1 && row[0].trim() == "") {
    //             skipped += 1;
    //             return;
    //         }

    //         string firstCol = row[0].toLowerAscii().trim();
    //         if firstCol == "employeeid" || firstCol == "employee_id" {
    //             skipped += 1;
    //             return;
    //         }

    //         if row.length() < 9 {
    //             errors += 1;
    //             log:printWarn("Skipping row due to insufficient columns (" + row.length().toString() + ")");
    //             return;
    //         }

    //         decimal|error basicSalary = decimal:fromString(row[5].trim());
    //         decimal|error allowances = decimal:fromString(row[6].trim());
    //         decimal|error deductions = decimal:fromString(row[7].trim());
    //         decimal|error netSalary = decimal:fromString(row[8].trim());

    //         if basicSalary is error || allowances is error || deductions is error || netSalary is error {
    //             errors += 1;
    //             log:printWarn("Skipping row due to numeric parse error for employeeId: " + row[0].trim());
    //             return;
    //         }

    //         do {
    //             check ensureDatabaseSelected();
    //             check insertPayslip(
    //                 row[0].trim(), row[1].trim(), row[2].trim(), row[3].trim(), row[4].trim(),
    //                 basicSalary, allowances, deductions, netSalary
    //             );
    //             processed += 1;
    //         } on fail var e {
    //             errors += 1;
    //             log:printError("Error inserting row for employeeId: " + row[0].trim() + " -> " + e.toString());
    //         }
    //     });

    //     check csvStream.close();

    //     log:printInfo("CSV upload summary -> processed: " + processed.toString() +
    //         ", skipped: " + skipped.toString() + ", errors: " + errors.toString());

    //     return {
    //         status: "success",
    //         message: "CSV uploaded and stored in DB successfully",
    //         processed: processed,
    //         skipped: skipped,
    //         errors: errors
    //     };
    // }

    // Public health check endpoint
    resource function get health() returns HealthResponse {
        logRequest("GET", "/health");
        return createHealthResponse();
    }
    
    // GET /api/users/me - return current user's role from users table
    resource function get api/users/me(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        string|error userEmail = ctx.getWithType("email");
        if userEmail is error {
            check caller->respond({"status":"error","message":"Unauthorized","code":401});
            return;
        }
        var row = fetchUserByEmail(userEmail);
        if row is error {
            check caller->respond({"status":"error","message":"Failed to read user","error":row.toString()});
            return;
        }
        string role = "user";
        if row is record {| string email; string user_role; |} {
            role = row.user_role;
        }
        boolean isAdmin = role.toLowerAscii() == "admin";
        check caller->respond({
            "status":"success",
            "data": { "email": userEmail, "role": role, "isAdmin": isAdmin }
        });
    }
    

        // POST /api/leaves - Submit new leave request
            resource function post api/leaves(http:Caller caller, http:Request req) returns error? {
                // Parse request body as LeavePayload
                json|error payloadJson = req.getJsonPayload();
                if payloadJson is error {
                    return caller->respond({
                        "status": "error",
                        "message": "Invalid leave request payload",
                        "error": payloadJson.toString()
                    });
                }

                LeavePayload|error leaveReq = payloadJson.cloneWithType(LeavePayload);
                if leaveReq is error {
                    return caller->respond({
                        "status": "error",
                        "message": "Invalid leave request payload structure",
                        "error": leaveReq.toString()
                    });
                }

                // Insert leave into DB (no foreign key check, user_id is just a field)
                error? dbResult = insertLeave(
                    leaveReq.leave_id,
                    leaveReq.user_id,
                    leaveReq.leave_type,
                    leaveReq.start_date,
                    leaveReq.end_date,
                    leaveReq.reason,
                    leaveReq.status
                );
                if dbResult is error {
                    return caller->respond({
                        "status": "error",
                        "message": "Failed to submit leave request",
                        "error": dbResult.toString()
                    });
                }

                return caller->respond({
                    "status": "success",
                    "message": "Leave request submitted successfully"
                });
        }

        // GET /api/leaves - Get all leaves for logged-in user (ignore status)
    resource function get api/leaves(http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        // Get userId from JWT context
        string|error userId = ctx.getWithType("email");
        if userId is error {
            check caller->respond({
                "status": "error",
                "message": userId.toString(),
                "error": userId.toString()
            });
            return;
        }

        // Fetch all leaves for user from DB (ignore status)
        var leavesResult = fetchLeavesByUser(userId);
        if leavesResult is error {
            check caller->respond({
                "status": "error",
                "message": "Failed to fetch leaves",
                "error": leavesResult.toString()
            });
            return;
        }

        LeavePayload[]|error leavesArr = leavesResult is LeavePayload[] ? <LeavePayload[]>leavesResult : error("Unexpected result type");
        if leavesArr is error {
            check caller->respond({
                "status": "error",
                "message": "Failed to fetch leaves",
                "error": leavesArr.toString()
            });
            return;
        }

        check caller->respond({
            "status": "success",
            "message": "Fetched all leaves for user",
            "count": leavesArr.length(),
            "data": leavesArr
        });
    }
    // DELETE /api/leaves/{leaveId} - Delete a leave owned by the user (or any if admin)
    resource function delete api/leaves/[string leaveId](http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        string|error userEmail = ctx.getWithType("email");
        if userEmail is error {
            check caller->respond({"status":"error","message":"Unauthorized"});
            return;
        }
        // Determine role
        var row = fetchUserByEmail(userEmail);
        boolean isAdmin = false;
        if row is record {| string email; string user_role; |} {
            isAdmin = row.user_role.toLowerAscii() == "admin";
        }
        // Attempt deletion
        error? delResult = isAdmin ? adminDeleteLeaveDB(leaveId) : deleteLeaveDB(leaveId, userEmail);
        if delResult is error {
            check caller->respond({"status":"error","message":"Failed to delete leave","error":delResult.toString()});
            return;
        }
        check caller->respond({"status":"success","message":"Leave deleted","leave_id":leaveId});
    }
    // PUT /api/leaves/{leaveId} - Update leave fields (type, dates, reason)
    resource function put api/leaves/[string leaveId](http:Caller caller, http:Request req, http:RequestContext ctx) returns error? {
        string|error userEmail = ctx.getWithType("email");
        if userEmail is error {
            check caller->respond({"status":"error","message":"Unauthorized"});
            return;
        }
        var row = fetchUserByEmail(userEmail);
        boolean isAdmin = false;
        if row is record {| string email; string user_role; |} {
            isAdmin = row.user_role.toLowerAscii() == "admin";
        }
        json|error payloadJson = req.getJsonPayload();
        if payloadJson is error {
            check caller->respond({"status":"error","message":"Invalid JSON payload"});
            return;
        }
        LeaveUpdatePayload|error upd = payloadJson.cloneWithType(LeaveUpdatePayload);
        if upd is error {
            check caller->respond({"status":"error","message":"Invalid payload structure"});
            return;
        }
        string leaveType = upd.leave_type;
        string startDate = upd.start_date;
        string endDate = upd.end_date;
        string reason = upd.reason ?: "";
        error? upRes = isAdmin
            ? adminUpdateLeaveDB(leaveId, leaveType, startDate, endDate, reason)
            : updateLeaveDB(leaveId, userEmail, leaveType, startDate, endDate, reason);
        if upRes is error {
            check caller->respond({"status":"error","message":"Failed to update leave","error":upRes.toString()});
            return;
        }
        check caller->respond({"status":"success","message":"Leave updated","leave_id":leaveId});
    }
    }
function fetchLeavesByUser(string userId) returns LeavePayload[]|error {
    // Use status = "%%" to fetch all statuses (or modify db_functions to allow status to be optional)
    // For now, fetch all leaves with status = "%" (wildcard)
    var result = fetchLeavesByUserAndStatus(userId);
    if result is error {
        return result;
    }
    // Map DB result to LeavePayload[]
    LeavePayload[] leaves = [];
    foreach var row in result {
        leaves.push({
            leave_id: row.leave_id,
            user_id: row.user_id,
            leave_type: row.leave_type,
            start_date: row.start_date,
            end_date: row.end_date,
            reason: row.reason,
            status: row.status
        });
    }
    return leaves;
}

// Fetch leaves filtered by status and map to LeavePayload
function fetchLeavesByStatus(string status) returns LeavePayload[]|error {
    var result = fetchLeavesByStatusDB(status);
    if result is error {
        return result;
    }
    LeavePayload[] leaves = [];
    foreach var row in result {
        leaves.push({
            leave_id: row.leave_id,
            user_id: row.user_id,
            leave_type: row.leave_type,
            start_date: row.start_date,
            end_date: row.end_date,
            reason: row.reason,
            status: row.status
        });
    }
    return leaves;
}

// Update leave status (approve/reject)
function updateLeaveStatus(string leaveId, string newStatus) returns error? {
    return updateLeaveStatusDB(leaveId, newStatus);
}

