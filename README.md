# Roslagens Bowlingklubb

A Swedish-language website for Roslagens Bowlingklubb, built with React and an Express API backed by MySQL. The public website introduces the club and its teams, while an invitation-based admin area lets club administrators manage the board member directory.

The project is under active development. The public pages and core administration features are implemented; the contact form and some content are still unfinished.

## Features

- Responsive club homepage with team and league information.
- Public board member directory loaded from the database.
- Administrator sign-in and sign-out with MySQL-backed sessions.
- Create, edit, hide, delete, and reorder board members, including drag-and-drop controls.
- Invite additional administrators using privately shared, single-use codes that expire after 24 hours.
- Argon2id password hashing and rate limits on sign-in and invitation redemption.

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Admin interactions | dnd-kit |
| Backend | Node.js, Express |
| Database | MySQL with mysql2 |
| Authentication | Argon2id, express-session, express-mysql-session |
| Linting | Oxlint |

## Project structure

```text
backend/
  auth/          Password, invitation, session, and access-control helpers
  migrations/    Numbered SQL schema files
  routes/        Authentication and board member endpoints
  db.js          Database pool and queries
  index.js       Express application
frontend/
  public/        Static assets
  src/
    api/         API client
    assets/      Images and club branding
    components/  Public and admin components
    data/        Club contact, team, and sponsor content
    pages/       Public pages, admin area, and invitation acceptance
```

## Local development

### Prerequisites

- Node.js 22.12 or later within the 22.x release line, matching the frontend's declared engine range.
- npm.
- A running MySQL server and a database user with access to a local development database.

Run the following commands from the repository root.

### 1. Install dependencies

```sh
npm --prefix backend ci
npm --prefix frontend ci
```

### 2. Prepare the database

Create a local database named `roslagensbwk`. Using your MySQL client, select that database and execute the files in `backend/migrations/` in numeric order, from `001_board_members.sql` through `005_sessions.sql`.

These files define the board directory, users, invitations, and session storage. They do not include production data or a default administrator. The first migration explicitly selects `roslagensbwk`; keep this consistent with your local database name.

The migrations are manual schema setup files, not an automatic migration runner. Apply them once to a fresh development database. The backend expects the session table to exist and does not create it automatically.

### 3. Configure the backend

Create `backend/.env`:

```dotenv
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_local_database_user
DB_PASSWORD=your_local_database_password
DB_NAME=roslagensbwk
SESSION_SECRET=replace_with_a_random_secret
```

Generate a session secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use the generated value for `SESSION_SECRET`. Keep environment files and real credentials out of version control. `DB_HOST` must be a hostname or IP address, rather than a full connection URL.

In development mode, the backend allows the frontend origin `http://localhost:5173`.

### 4. Configure the frontend

Create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
```

Use the API base URL without a trailing slash. Vite exposes `VITE_` variables to the browser, so they must never contain secrets. Restart the frontend development server after changing this file.

### 5. Start both applications

Start the backend in one terminal:

```sh
npm --prefix backend run dev
```

Start the frontend in another terminal:

```sh
npm --prefix frontend run dev -- --port 5173 --strictPort
```

Open <http://localhost:5173>. The backend runs at <http://localhost:3000>. Its `/health` endpoint returns HTTP 200 when the database connection succeeds and HTTP 503 when it fails.

### Administrator access

The admin area is available at `/admin`. An existing administrator can create an invitation and privately share its code with the intended recipient, who completes registration at `/acceptera-inbjudan`. No invitation email is sent automatically.

There is currently no first-administrator setup command or public registration flow. A fresh installation requires a separately provisioned initial admin account before the invitation flow can be used. Never commit an initial account's password, password hash, or invitation code.

## Development checks

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
```

The build runs TypeScript checks and writes the frontend output to `frontend/dist/`. Neither package currently defines an automated test command.

## Deployment notes

The frontend and backend are separate applications and can be deployed as separate resources.

- Build the frontend with `npm run build` from `frontend/` and serve `dist/` as static files. Configure a fallback to `index.html` for client-side routes such as `/admin`.
- Set `VITE_API_URL` before building the frontend. Changing it in a deployed environment requires a new frontend build.
- Run `npm start` from `backend/` with environment variables supplied by the hosting platform; this command does not load `.env` automatically.
- Set `NODE_ENV=production`, `FRONTEND_URL` to the exact frontend origin, and the database and session variables described above. Serve the application over HTTPS so secure session cookies work.
- Keep the frontend and API on the same site, for example `www.example.com` and `api.example.com`, to support the current `SameSite=Lax` session cookie policy.
- The production backend trusts one reverse proxy hop. Verify that this matches the hosting network and how client IP addresses are forwarded.
- Prepare the database schema before starting the backend. Use separate development and production databases.

## Current limitations

- The contact form is disabled and does not send messages.
- Sponsor entries are placeholders, and some club details still need to be completed.
- Password changes, account recovery, and administrator account management are not available in the UI.
- Rate limits use process-local storage; deployments with multiple backend instances need a shared strategy.
- Production configuration and authentication flows should be verified in the target hosting environment.

## Licensing and assets

A repository-wide license has not yet been specified. The backend package currently declares ISC in its package metadata. Club branding, images, and third-party dependencies may have separate terms; do not assume that a future code license also covers those assets.
