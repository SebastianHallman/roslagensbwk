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

Create a database named `roslagensbwk` with the `utf8mb4` character set. Using a MySQL client, select that database and execute the files in [`backend/migrations`](backend/migrations) in numeric order, from `001_board_members.sql` through `008_news.sql`.

The first migration explicitly selects `roslagensbwk`. If you use a different database name, adjust that statement before running it and set `DB_NAME` accordingly. The migrations are applied manually; there is no migration runner or migration history table. Do not rerun all migrations against an existing schema.

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
