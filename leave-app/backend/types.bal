// ==============================
// Core Data Models and API Types
// ==============================
// Defines the core data structures, API response formats, 
// request validation types, and authentication-related types
// used throughout the Payslip service.
// ==============================

// Core payslip data model
import ballerinax/mysql;
public type Payslip record {|
    string employeeId;
    string name;
    string designation;
    string payPeriod; // Format: YYYY-MM
    float basicSalary;
    float allowances;
    float deductions;
    float netSalary;
    string? department; // Optional field for future expansion
    string? location; // Optional field for future expansion
|};


// API Response wrapper types
public type PayslipResponse record {|
    string status;
    string message;
    Payslip data;
|};

public type PayslipsResponse record {|
    string status;
    string message;
    Payslip[] data;
    int count;
|};

public type ErrorResponse record {|
    string status;
    string message;
    string errorCode;
    string? details?;
|};

public type HealthResponse record {|
    string status;
    string message;
    string timestamp;
    string version;
|};

// Request validation types
public type ValidationError record {|
    string fieldName;
    string message;
|};

// Authentication types for extensibility
public type AuthContext record {|
    string userId;
    string[] roles;
    string? token?;
    boolean isAuthenticated;
    string? department?; // For department-based filtering
|};

public type AuthConfig record {|
    boolean enabled;
    string? jwtSecret?;
    int tokenExpirySeconds;
    string[] publicEndpoints; // Endpoints that don't require auth
|};

// Leave request payload type
// public type LeavePayload record {| 
//     string leave_id;
//     string user_id;
//     string leave_type;
//     string start_date;
//     string end_date;
//     string reason;
//     string status;
//     string? portion_of_day = ();
//     string[]? notify_people = ();
//     string? additional_comment = ();
// |};


# [Configurable] Superapp mobile database configs.
type DatabaseConfig record {|
    # Database hostname
    string host;
    # Database username
    string user;
    # Database password
    string password;
    # Database name
    string database;
    # Database port
    int port = 3306;
    # SQL Connection Pool configurations
    ConnectionPool connectionPool;
|};

# mysql:Client database config record.
type SuperappMobileDatabaseConfig record {|
    *DatabaseConfig;
    # Additional configurations related to the MySQL database connection
    mysql:Options? options;
|};

# mysql:ConnectionPool parameter record with default optimized values 
type ConnectionPool record {|
    # The maximum open connections
    int maxOpenConnections = 10;
    # The maximum lifetime of a connection in seconds
    decimal maxConnectionLifeTime = 180;
    # The minimum idle connections in the pool
    int minIdleConnections = 5;
|};




