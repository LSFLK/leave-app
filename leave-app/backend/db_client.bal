import ballerinax/mysql;
import ballerinax/mysql.driver as _; // bundle driver

// Provides a shared database client for the application
// Config values are supplied at runtime
configurable DatabaseConfig databaseConfig = ?;

// Helper to construct the MySQL client at module init
isolated function createDatabaseClient() returns mysql:Client|error {
    mysql:Client db = check new mysql:Client(
        host = databaseConfig.host,
        user = databaseConfig.user,
        password = databaseConfig.password,
        database = databaseConfig.database,
        port = databaseConfig.port,
        options = {
            ssl: { mode: mysql:SSL_PREFERRED },
            // Timeout in seconds (decimal as per API)
            connectTimeout: 10d
        },
        // Map our custom ConnectionPool record to the expected shape
        connectionPool = {
            maxOpenConnections: databaseConfig.connectionPool.maxOpenConnections,
            maxConnectionLifeTime: databaseConfig.connectionPool.maxConnectionLifeTime,
            minIdleConnections: databaseConfig.connectionPool.minIdleConnections
        }
    );
    return db;
}

final mysql:Client databaseClient = checkpanic createDatabaseClient();
