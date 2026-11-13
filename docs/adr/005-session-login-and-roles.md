# ADR-005: Session-cookie login with Spring Security, scoped to the logged-in customer

- **Status:** Accepted
- **Date:** 2026-11-10 (sign-up, website login and roles added 2026-11-12)

## Context

Nothing personal may be visible before login, each customer must only ever see their own data, and staff
(risk officers) work in separate areas. The most common API security bug is "broken object level
authorisation": an endpoint that trusts an id from the request and returns someone else's data.

## Decision

- **Server-side sessions** (Spring Session JDBC, in PostgreSQL), not tokens in the browser: the `SESSION`
  cookie is HttpOnly, Secure and SameSite=Lax, the session id changes at login, idle sessions end after 1 hour,
  and logging out deletes the session on the server.
- **Argon2id** password hashes; passwords of 12 to 128 characters, passphrases welcome, common passwords and
  ones containing the person's name or email refused (on the server, not just in the form).
- **CSRF** protection on every change (`XSRF-TOKEN` cookie copied into the `X-XSRF-TOKEN` header).
- **Rate limiting** of failed logins and sign-ups per visitor address; the same message for an unknown email
  and a wrong password, so the login can't be used to discover who has an account.
- **Deny by default.** Roles: `customer` for banking endpoints, `risk_officer`/`admin` for `/api/risk/**`.
  Every customer query takes the customer id from the session (`CurrentCustomer`), never from the request.
- The website's route guard asks the API who is logged in and redirects by role; the API remains the real gate.
- Every login, sign-up and sensitive action is written to the append-only audit log.

## Consequences

- Isolation is tested both ways (customer A vs customer B; customers vs staff), and mutation checks confirm
  those tests fail if a filter or rule is removed.
- Sessions live in PostgreSQL, so the API can restart or run more copies without logging people out.
- Next steps from the plan: a second factor, account lockout, and "sign out everywhere".
