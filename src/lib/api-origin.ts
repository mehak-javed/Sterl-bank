/**
 * Where the Java API runs (server side only). Locally: the Spring Boot app on port 8080.
 * In production, set STERL_API_URL in Vercel to the deployed API's address.
 */
export const API_ORIGIN = process.env.STERL_API_URL ?? "http://localhost:8080";
