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
| Money | Double-entry ledger enforced by the database; append-only ledger and audit log; idempotent transfers with row locking |
| Data | 100% fake data generated with a fixed seed (ADR-002). Login with passkeys never sends biometric data to Sterl |

Coming next: login with Spring Security, two-factor authentication and passkeys, per-customer data
isolation tests, CSRF protection, security headers and rate limiting.

## Supported versions

Only the latest version on `main` (deployed at https://sterl-bank.vercel.app) is supported.
