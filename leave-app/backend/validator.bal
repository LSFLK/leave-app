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


// Extracts the emp_id claim from JWT payload
public isolated function extractEmployeeId(jwt:Payload payload) returns string|error {
    anydata|error empClaim = payload["emp_id"] ?: payload["email"];
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

    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:InternalServerError|http:Response|error? {
        string fullPath = req.rawPath;
        // Allow CORS preflight requests without auth validation
        if req.method().equalsIgnoreCase("OPTIONS") {
            http:Response preflightRes = new;
            preflightRes.statusCode = 204; // No Content for preflight
            return preflightRes;
        }
        if fullPath.startsWith("/health") {
            log:printInfo("Public endpoint accessed: " + fullPath);
            return ctx.next();
        }

        // Build validator config dynamically per endpoint group using JWKS
        jwt:ValidatorConfig validatorConfig = {};
            log:printInfo("From microapp endpoints " + fullPath);
            validatorConfig = {
                issuer: MICROAPP_ISSUER,
                audience: "3c902ec06f25026af435afc5380cbec3903256a1daf8cfc22db0997bff8c0f15",
                clockSkew: 60,
                signatureConfig: { jwksConfig: { url: MICROAPP_JWKS_URL } }
            };
        

        // Obtain token from custom header first; fallback to Authorization bearer
        string|error idToken = req.getHeader(JWT_ASSERTION_HEADER);
        if idToken is error {
            string|error authHeader = req.getHeader(AUTHORIZATION_HEADER);
            if authHeader is string {
                string trimmed = authHeader.trim();
                if trimmed.toLowerAscii().startsWith("bearer ") {
                    idToken = trimmed.substring(7);
                } else {
                    idToken = trimmed;
                }
            }
        }

        if idToken is error || idToken.trim().length() == 0 {
            string errorMsg = "Missing Authorization/JWT header";
            log:printError(errorMsg, idToken is error ? idToken : ());
            http:Response res = new;
            res.statusCode = 401;
            check res.setJsonPayload({ message: errorMsg });
            return res;
        }

        jwt:Payload|jwt:Error payload = jwt:validate(idToken, validatorConfig);
        if payload is jwt:Error {
            // More granular logging: include underlying validation failure reason
            string errorMsg = "JWT validation failed: " + payload.message();
            log:printError(errorMsg, payload);
            http:Response res = new;
            res.statusCode = 401;
            check res.setJsonPayload({ message: errorMsg });
            return res;
        }
        // TODO: (Optional) attach emp_id to context for downstream usage if needed.
        return ctx.next();
    }
}