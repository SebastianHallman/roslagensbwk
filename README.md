# Roslagens Bowlingklubb

A Swedish-language website for Roslagens Bowlingklubb, with public club information and an administration panel for managing board members, news, and tournaments.

## Features

- Club introduction, team information, sponsors, and contact details.
- Published news with individual article pages.
- Tournament calendar and detail pages, including multiple rounds, venues, and result links.
- Admin tools for creating, editing, publishing, and deleting news and tournaments.
- Board member management with visibility settings and drag-and-drop ordering.
- Invitation-based admin accounts and cookie-based sessions stored in MySQL.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, and React Router.
- **Backend:** Node.js, Express, and MySQL through `mysql2`.
- **Authentication:** Argon2 password hashing, Express sessions, and rate-limited sign-in and invitation redemption.

## Repository structure

```text
frontend/
  src/components/   Public website and admin components
  src/pages/        Route-level pages
  src/api/          Backend API clients
  src/data/         Static club, team, and sponsor content
backend/
  auth/             Authentication, sessions, and invitations
  routes/           Board, auth, tournament, and news endpoints
  migrations/       Numbered SQL schema migrations
  db.js             Database connection and queries
  index.js          Express application entry point
```

The frontend and backend are separate npm projects. Run commands in the relevant directory; there is no root npm package.

## Local development

### Prerequisites

- Node.js **22.12 or later within the 22.x release line**, as required by the frontend package.
- npm.
- A running MySQL server and credentials for a development database.

### 1. Install dependencies

From the repository root:

```sh
cd backend
npm ci
cd ../frontend
npm ci
```

### 2. Set up the database

Create a database named `roslagensbwk` with the `utf8mb4` character set. Using a MySQL client, select that database and execute the files in [`backend/migrations`](backend/migrations) in numeric order, from `001_board_members.sql` through `013_sponsor_list_metadata.sql`.

The first migration explicitly selects `roslagensbwk`. If you use a different database name, adjust that statement before running it and set `DB_NAME` accordingly. The migrations are applied manually; there is no migration runner or migration history table. Do not rerun all migrations against an existing schema.

Before deploying the teams and sponsors backend, apply any pending migrations from `010_teams.sql` through `013_sponsor_list_metadata.sql`. Migration 012 records creation requests so retries return the original entry ID. Migration 013 populates the stored list metadata for existing sponsors. New teams and sponsors tables start empty. Admins can add teams with their series and result links. Each sponsor can have a PNG, JPEG, or WebP logo up to 512 KiB.

### 3. Configure the backend

Create `backend/.env`:

```dotenv
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=roslagensbwk
SESSION_SECRET=replace_with_a_long_random_secret
```

`DB_HOST` must be a hostname, not a database connection URL. Use your own credentials and a strong random session secret. Local `.env` files are ignored by Git.

In development, the backend allows requests from `http://localhost:5173`. Outside development, set `FRONTEND_URL` to the frontend's exact origin.

### 4. Configure the frontend

Create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
```

Use the API base URL without a trailing slash. Vite exposes `VITE_` variables to the browser, so they must not contain secrets.

### 5. Start both applications

In one terminal:

```sh
cd backend
npm run dev
```

In another terminal, starting from the repository root:

```sh
cd frontend
npm run dev
```

Open `http://localhost:5173`. The backend runs at `http://localhost:3000`; `GET /health` reports API and database availability. Keep Vite on port `5173` to match the development CORS configuration.

### Admin access

The admin panel is available at `/admin`. Public sign-up is not implemented. An existing administrator can generate an invitation in the panel and share the invitation link manually; the application does not send invitation emails.

A fresh database has no admin account. The first administrator must be provisioned manually in the `users` table with an Argon2 password hash compatible with `backend/auth/passwords.js` and the role `admin`. There is currently no seed or bootstrap command.

## Verification

Run frontend checks from `frontend/`:

```sh
npm run lint
npm run build
```

Run the existing backend tests from `backend/`:

```sh
node --test
```

To preview a frontend production build locally, run `npm run preview` from `frontend/`. The preview server uses a different origin from the development server; configure backend CORS to match if you need API access during preview.

## Deployment notes

- Build the frontend with `npm ci` followed by `npm run build`, and serve `frontend/dist`. Configure the host to return `index.html` for client-side routes such as `/admin` and `/nyheter/:id`.
- Set `VITE_API_URL` before building the frontend. Changing it requires a new build.
- Run the backend with `npm ci` followed by `npm start`. Supply environment variables through the hosting platform; `npm start` does not load `.env` automatically.
- Set `NODE_ENV=production`, `FRONTEND_URL`, the database variables, and `SESSION_SECRET` on the backend. Apply any pending SQL migrations separately.
- Use HTTPS in production. Session cookies are secure in production and use `SameSite=Lax`; keep the frontend and API on the same site, for example on HTTPS subdomains of the same domain, for authenticated requests.
- The production backend trusts one reverse proxy hop. Ensure the hosting network and forwarded headers match that configuration.

Static club content lives in `frontend/src/data/` and the frontend components. Board members, news, tournaments, rounds, admin accounts, invitations, and sessions are stored in MySQL.

### Contact email configuration

The backend accepts `POST /contact` with JSON fields `name`, `email`, `message`, and `turnstileToken`. Names are limited to 100 characters and messages to 2,000 characters (JavaScript string length). The general 10 kB JSON request limit also applies. Each IP can make five attempts per 15 minutes, including invalid submissions. Limits are held in memory per backend process and reset on restart.

Set `RESEND_API_KEY`, `FROM_EMAIL` (a sender on a verified Resend domain), and `CONTACT_TO_EMAIL` (the club's recipient address) on the backend. Never expose these settings through Vite variables. Publish the Resend template alias `bwk-kontaktformular` with string variables `CONTACT_NAME`, `CONTACT_EMAIL`, and `CONTACT_MESSAGE`. Submitted content is HTML-escaped before insertion, and the visitor's address is used as `Reply-To`, while the sender remains `FROM_EMAIL`.

Set `TURNSTILE_SECRET_KEY` and `TURNSTILE_HOSTNAME` on the backend. The hostname must exactly match the frontend hostname, without protocol, port, or path (for example `localhost` locally, or the club's frontend subdomain in production). After rate limiting, the backend verifies the token with Cloudflare's Siteverify API, requires `success: true`, the configured hostname, and action `contact`, and allows five seconds for the verification request and response body. Missing configuration or verification service failures block sending. No token or secret is logged. Use a separate development widget allowing `localhost` with real development keys to test these strict hostname and action checks; Cloudflare's dummy keys return `example.com` and omit the action.

Set `VITE_TURNSTILE_SITE_KEY` in the frontend environment before building (or in `frontend/.env` for local development). Use the site key from the same widget as the backend secret, and allow the frontend hostname in that widget's Cloudflare settings. The React widget uses action `contact`, displays in Swedish, and resets after every submission attempt. The submit button stays disabled until a token is available. Missing configuration, loading failures, expired challenges, and rejected tokens show Swedish messages. Rebuild the frontend after changing its site key; restart the backend after changing its environment settings.

Successful delivery requests return 200, invalid input or verification 400 (verification errors include `code: INVALID_CAPTCHA`), excessive attempts 429, missing configuration or verification service failures 503, and Resend failures 502. A 200 response confirms Resend accepted the request; it does not guarantee inbox delivery. The website form shows Swedish status and error messages, prevents duplicate submissions while sending, and clears the fields only after a successful response. Failed submissions retain their contents for retrying.

### Scheduled auth cleanup

From `backend/`, run `npm run cleanup:auth` with the backend's `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` environment variables. For local development with `backend/.env`, use `node --env-file=.env scripts/cleanup-auth.js` instead.

The command deletes expired admin invitations, password reset tokens, and sessions in one transaction. Active records and invitations without an expiry date are preserved. Successful invitation redemption and password resets already consume their tokens. Session storage also clears expired sessions automatically every 15 minutes while the API is running.

Apply migrations through `009_password_reset_tokens.sql` before running the command. Schedule it hourly (`0 * * * *`) in the backend container with `npm run cleanup:auth`, using the directory containing the backend's `package.json` as the working directory and the same database environment as the API. If using host cron, run the command inside the backend container; container database hostnames may not resolve on the host.

Each successful run logs only the number of deleted records per table. Failures roll back the transaction and exit with status `1`. Check the scheduler logs after configuration. Adding this command does not itself enable a scheduled job.
