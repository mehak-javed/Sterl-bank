# Sterl

[![CI](https://github.com/mehak-javed/Sterl-bank/actions/workflows/ci.yml/badge.svg)](https://github.com/mehak-javed/Sterl-bank/actions/workflows/ci.yml)
[![API CI](https://github.com/mehak-javed/Sterl-bank/actions/workflows/api.yml/badge.svg)](https://github.com/mehak-javed/Sterl-bank/actions/workflows/api.yml)
[![CodeQL](https://github.com/mehak-javed/Sterl-bank/actions/workflows/codeql.yml/badge.svg)](https://github.com/mehak-javed/Sterl-bank/actions/workflows/codeql.yml)

Security: see [SECURITY.md](SECURITY.md).

> **Sterl is a portfolio demo. Not a real bank. All data is fake.**

A responsive demo banking web app: a personal banking dashboard plus a live (simulated) FX markets desk.

## Stack
Next.js (App Router) · React · TypeScript · Tailwind CSS. More to come: Zustand, Redux Toolkit, TanStack Query, React Hook Form + Zod, AG Grid, Vitest, React Testing Library, MSW, Playwright.

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Bank thinking
- Money is always stored as integer pence (`1234` = £12.34), never floats.
- All customers, accounts and transactions are generated fake data (seeded Faker.js).
