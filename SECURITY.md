# Security policy

> Sterl is a portfolio demo. Not a real bank. All data is fake.
> There is no real money, no real customer data and no real card numbers anywhere in Sterl.

## Reporting a vulnerability

If you find a security problem, please **don't open a public issue**. Report it privately through
GitHub: **Security tab → Report a vulnerability** on this repository. I'll reply within a few days.

Please include what you found, how to reproduce it, and what an attacker could do with it.
Testing against https://sterl-bank.vercel.app is welcome, as long as you don't attempt denial of
service, spam other users, or try to access anything outside this demo.

## How Sterl is protected

| Area | What's in place |
| --- | --- |
| Code | **CodeQL** static analysis (security-extended queries) on every pull request and weekly |
| Dependencies | **Dependabot** security alerts and fixes, plus weekly version updates, all through CI |
| Secrets | **Secret scanning with push protection**: a commit containing a key or token is blocked before it reaches GitHub. Secrets live only in environment variables (`.env.local`, Vercel and AWS settings) |
| Changes | Branch protection: every change goes through a pull request with lint, typecheck, tests and build passing |
| API | Bound SQL parameters only; server-side validation of every input; strict JSON (no rounding of money); errors as problem details without internals; only `health` and `info` Actuator endpoints exposed |
| Login | Spring Security; Argon2id password hashes; sessions stored server-side in PostgreSQL with a 1-hour idle timeout; session cookie HttpOnly, Secure, SameSite=Lax; new session id at login; one answer for wrong password and unknown email; failed-login throttling; every attempt audited |
| Access | Deny by default; every query filtered by the logged-in customer, with tests proving one customer can't read or move another's money (OWASP API1); other customers' ids return 404 |
| Browser | CSRF token on every state-changing request; CSP `default-src 'none'`, no framing, no MIME sniffing, no referrer, no caching of responses |
| Money | Double-entry ledger enforced by the database; append-only ledger and audit log; idempotent transfers with row locking |
| Data | 100% fake data generated with a fixed seed (ADR-002). Login with passkeys never sends biometric data to Sterl |

Coming next: two-factor authentication and passkeys, account lockout, inactivity logout, step-up
authentication for sensitive actions, and "sign out of all devices".

## Supported versions

Only the latest version on `main` (deployed at https://sterl-bank.vercel.app) is supported.
