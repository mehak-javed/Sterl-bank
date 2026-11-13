# Deploying Sterl

The website is already on Vercel. This guide puts the Java API and its database online, free, so logging in,
banking, payments and the risk desk work on https://sterl-bank.vercel.app.

| Piece | Where | Cost |
| --- | --- | --- |
| Website (Next.js) | Vercel (already set up) | Free (Hobby) |
| Java API (Docker) | Render, Web Service, Free instance | Free, no card needed |
| PostgreSQL | Neon, Free plan | Free, no card needed |

Why not AWS yet: the free AWS tier needs a card and more set-up. The API is a normal Docker container, so it can
move to AWS later without code changes.

**Before you start:** the pull request that adds `sterl-api/Dockerfile` must be merged into `main`.

---

## 1. Create two secrets on your Mac (2 minutes)

Run these in Terminal. Save both outputs in your password manager straight away.

```bash
openssl rand -base64 32
```
That is your **data key** (`STERL_DATA_KEY`). It encrypts names and card details. If you lose it, that data can
never be read again, so keep a safe copy.

```bash
openssl rand -hex 32
```
That is your **proxy secret** (`STERL_PROXY_SECRET`). It proves to the API that a request came from your website.

Never put either value in git, a chat, a screenshot or an AI prompt.

## 2. The database: Neon (5 minutes)

1. Go to https://neon.tech and sign up with GitHub.
2. Create a project: name `sterl`, PostgreSQL **18** (or the newest offered), region **AWS Europe (Frankfurt)**.
3. On the project dashboard click **Connect**. Switch **Connection pooling OFF** (the API's migrations need a
   direct connection). You'll see a connection string like
   `postgresql://neondb_owner:AbC123@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require`.
4. Split it into three values (example in brackets):
   - **STERL_DB_URL** = `jdbc:postgresql://` + the host + `/` + database + `?sslmode=require`
     (`jdbc:postgresql://ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require`)
   - **STERL_DB_USER** = the part before the colon (`neondb_owner`)
   - **STERL_DB_PASSWORD** = the part between the colon and the `@` (`AbC123`)

You don't create any tables: the API builds and fills the database itself on its first start (Flyway).

## 3. The API: Render (10 minutes, plus ~10 minutes for the first build)

1. Go to https://render.com and sign up with GitHub. Allow it to see the `Sterl-bank` repository.
2. **New → Web Service →** pick `mehak-javed/Sterl-bank`.
3. Fill in:
   - Name: `sterl-api` · Region: **Frankfurt** (next to the database) · Branch: `main`
   - **Root Directory: `sterl-api`** · Language: **Docker** · Instance type: **Free**
4. **Environment Variables** (Add each one):

   | Key | Value |
   | --- | --- |
   | `STERL_DB_URL` | from step 2 |
   | `STERL_DB_USER` | from step 2 |
   | `STERL_DB_PASSWORD` | from step 2 |
   | `STERL_DATA_KEY` | the data key from step 1 |
   | `STERL_PROXY_SECRET` | the proxy secret from step 1 |

   Don't add `STERL_COOKIE_SECURE` (it is secure by default) or any AI key (fixed wording is used).
5. **Advanced → Health Check Path:** `/actuator/health/readiness`
6. Click **Deploy Web Service**. Watch the log: the Docker build, then `Started SterlApiApplication`. When the
   status says **Live**, copy the address at the top, e.g. `https://sterl-api-ab12.onrender.com`.
7. Check it: open `https://sterl-api-ab12.onrender.com/actuator/health` in your browser. You should see
   `{"status":"UP"}`.

## 4. Connect the website: Vercel (5 minutes)

1. https://vercel.com → your Sterl project → **Settings → Environment Variables**.
2. Add, for **Production** and **Preview**:

   | Key | Value |
   | --- | --- |
   | `STERL_API_URL` | the Render address, **no slash at the end** (`https://sterl-api-ab12.onrender.com`) |
   | `STERL_PROXY_SECRET` | the same proxy secret as on Render |

3. **Deployments →** the newest Production deployment **→ ⋯ → Redeploy.** (Needed: the website reads
   `STERL_API_URL` when it is built.)

## 5. Try it

Open https://sterl-bank.vercel.app/login and log in as Nikita or Morgan (logins in
[demo-accounts.md](demo-accounts.md)). Try a payment of £1,200 as Nikita (held), then release it as Morgan.

## Good to know

- **The free API sleeps** after 15 minutes without visitors; the next visit wakes it in about a minute, and the
  first login may say it couldn't reach Sterl. Open the `/actuator/health` address first, or before sharing the
  link with a recruiter. To keep it awake, a free monitor (e.g. UptimeRobot) can open that address every 10
  minutes; one always-on free service fits in Render's monthly free hours.
- **Cost:** neither Render Free nor Neon Free asks for a card, so nothing can be charged. If you ever upgrade or add
  a card, set a spending limit there first.
- **Updates:** every merge to `main` redeploys both the website (Vercel) and the API (Render). New Flyway
  migrations run automatically when the API starts.
- **Something wrong?** Render → `sterl-api` → **Logs**. A database error usually means a wrong `STERL_DB_*` value;
  "couldn't reach Sterl" on the website usually means `STERL_API_URL` is wrong or wasn't followed by a redeploy.
