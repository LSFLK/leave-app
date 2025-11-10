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


// Extracts a usable email for the current user from the JWT payload.
// Tries common keys in order: email, preferred_username, upn, sub.
// If a claim looks like an email (contains '@'), it's accepted.
public isolated function extractEmail(jwt:Payload payload) returns string|error {
    anydata?[] candidates = [payload["email"], payload["preferred_username"], payload["upn"], payload["sub"], payload["emp_id"]];
    foreach var c in candidates {
        if c is string {
            string v = c.trim();
            if v.length() > 0 {
                return v;
            }
        }
    }
    return error("email claim not found in JWT payload");
}


// Interceptor service to handle authorization for each incoming request
service class JwtInterceptor {
    *http:RequestInterceptor;

    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:InternalServerError|http:Response|error? {
        string fullPath = req.rawPath;
        if fullPath.startsWith("/health") {
            log:printInfo("Public endpoint accessed: " + fullPath);
            return ctx.next();
        }

        // Build validator config dynamically per endpoint group using JWKS
        jwt:ValidatorConfig validatorConfig = {};
            log:printInfo("From microapp endpoints " + fullPath);
            validatorConfig = {
                issuer: MICROAPP_ISSUER,
                audience: "XtbUBfXj9aLNe3aR0MP7VqKN9utHWg7fgYfxx8VfC6U=",
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
            string errorMsg = "Missing invoker info header!";
            log:printError(errorMsg, idToken is error ? idToken : ());
            return <http:InternalServerError>{ body: { message: errorMsg } };
        }

        jwt:Payload|jwt:Error payload = jwt:validate(idToken, validatorConfig);
        if payload is jwt:Error {
            string errorMsg = "JWT validation failed! Unauthorized !!!";
            log:printError(errorMsg, payload);
            return <http:InternalServerError>{ body: { message: errorMsg } };
        }
        // Extract and attach email to the request context for downstream handlers
        string|error email = extractEmail(payload);
        if email is error {
            string errorMsg = "Missing 'email' in JWT claims";
            log:printError(errorMsg, email);
            return <http:InternalServerError>{ body: { message: errorMsg } };
        }
        // Store as a typed string; service code reads ctx.getWithType("email")
        ctx.set("email", email);
        log:printInfo("Authenticated user: " + email);
        return ctx.next();
    }
}