/**
 * Where the Java API runs (server side only). Locally: the Spring Boot app on port 8080.
 * In production, set STERL_API_URL in Vercel to the deployed API's address.
 *
 * Values pasted into a hosting dashboard often carry an invisible line break or space, or a trailing
 * slash; any of those would break every forwarding rule (Vercel refuses a rewrite whose destination
 * doesn't start with http:// or https://). So the value is cleaned, and anything still not a plain
 * http(s) address stops the build with a clear message instead of a confusing one.
 */
export function apiOriginFrom(raw: string | undefined): string {
  const value = (raw ?? "").trim().replace(/\/+$/, "");
  if (value === "") return "http://localhost:8080";
  if (!/^https?:\/\/[^\s/]+$/.test(value)) {
    throw new Error(
      `STERL_API_URL must be just the API's address, like https://sterl-api.example.com (got "${value}")`,
    );
  }
  return value;
}

export const API_ORIGIN = apiOriginFrom(process.env.STERL_API_URL);
