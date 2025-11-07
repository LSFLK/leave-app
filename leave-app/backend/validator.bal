// ==============================
// JWT Validator & Interceptor
// ==============================
// Handles JWT validation for microapp and admin portal endpoints.
// Responsibilities:
// - Extract employee ID from JWT payload
// - Validate JWT based on issuer, audience, and public key
// - Intercept requests and attach emp_id to request context
// - Allow public endpoints like /health without validation
// ==============================

import ballerina/http;
import ballerina/jwt;
import ballerina/log;

// Note: Signature validation now relies on platform defaults (no local cert files).

// Extracts the emp_id claim from JWT payload
public isolated function extractEmployeeId(jwt:Payload payload) returns string|error {
    anydata|error empClaim = payload["email"];

    if empClaim is error {
        return error("emp_id claim not found in JWT payload");
    }

    if empClaim is string {
        return empClaim;
    }

    return error("emp_id claim is not a string");
}


// Interceptor service to handle authorization for each incoming request
service class JwtInterceptor {

    *http:RequestInterceptor;

    // Default interceptor triggered for all resource function calls
    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:Response|error? {

        // Skip validation for public health endpoint
        string fullPath = req.rawPath;
        if fullPath.startsWith("/health"){
            log:printInfo("Public endpoint accessed: " + fullPath);
            return ctx.next();
        }

        // Configure validator based on endpoint type
        // Use Asgardeo JWKS for signature verification derived from the issuer URL
        jwt:ValidatorConfig validatorConfig = {
            issuer: ASGARDEO_ISSUER,
            audience: ASGARDEO_AUDIENCE,
            clockSkew: 60,
            signatureConfig: { jwksConfig: { url: ASGARDEO_JWKS_URL } }
        };
        if fullPath.startsWith("/admin-portal") {
            log:printInfo("From admin portal endpoints " + fullPath);
        } else {
            log:printInfo("From microapp endpoints " + fullPath);
        }


        // Extract JWT token from request headers: prefer custom header, fallback to Authorization: Bearer
        string|error idToken = req.getHeader(JWT_ASSERTION_HEADER);
        if idToken is error {
            string|error authHeader = req.getHeader(AUTHORIZATION_HEADER);
            if authHeader is string {
                string trimmed = authHeader.trim();
                if trimmed.toLowerAscii().startsWith("bearer ") {
                    idToken = trimmed.substring(7);
                } else {
                    idToken = trimmed; // accept raw token if Bearer not used
                }
            }
        }

        if idToken is error || idToken.trim().length() == 0 {
            string errorMsg = "Missing or empty Authorization token";
            log:printError(errorMsg, idToken is error ? idToken : ());
            http:Response resp = new;
            resp.statusCode = 401;
            resp.setJsonPayload({ message: errorMsg });
            return resp;
        }

        // Validate JWT (issuer, audience, expiry, signature via JWKS)
        jwt:Payload|jwt:Error payload = jwt:validate(idToken, validatorConfig);
        if payload is jwt:Error {
            string errorMsg = "JWT validation failed";
            log:printError(errorMsg, payload);
            http:Response resp = new;
            resp.statusCode = 401;
            resp.setJsonPayload({ message: errorMsg });
            return resp;
        }

        // For microapp endpoints, extract employee ID and attach to context
        if !fullPath.startsWith("/admin-portal") {
             //Extract emp_id
            string|error empId = extractEmployeeId(payload);
            if empId is error {
                log:printError("Failed to extract emp_id", empId);
                http:Response resp = new;
                resp.statusCode = 401;
                resp.setJsonPayload({ message: "Invalid token: emp_id missing" });
                return resp;
            }

            log:printInfo("Authenticated employee ID: " + empId);
            ctx.set("emp_id", empId);
        }
       
        
        return ctx.next();
    }
}