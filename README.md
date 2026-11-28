# ArthFlow

ArthFlow is a simple, personal finance tracker built for clarity: log income and expenses, manage categories, set monthly budgets, and see clear reports in Indian Rupees.

Everything runs on **Cloudflare**: the React site, the Express API, and the database (**Cloudflare D1**). No MongoDB Atlas account and no connection string are needed.

## Features

- JWT login and registration with bcrypt password hashing
- Per-user data isolation — every transaction, category, and budget is scoped to the signed-in user
- Transactions with title, amount, type, category, date, payment method, and notes
- 14 default income/expense categories, with a “Restore defaults” action
- Monthly budgets with spending, remaining amount, percentage, and exceeded state
- Dashboard with balance, current-month summary, 6-month chart, category breakdown, and recent transactions
- Reports with date range, type filter, monthly totals, and category breakdowns
- Profile and password settings, including opening balance
- Responsive light/dark UI, all currency formatted as INR

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, React Router, Tailwind CSS, Axios, Recharts, Lucide React |
| API | Express on a Cloudflare Worker (`nodejs_compat`) |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT stored in `localStorage`, bcryptjs hashing |
| Deployment | Wrangler / Cloudflare Workers |

## Requirements

- Node.js 20.19 or newer
- A free Cloudflare account
- Wrangler (installed as a dev dependency)

No MongoDB installation or Atlas account is required.

---

## Local development

### 1. Install dependencies

```powershell
npm run install:all
```

### 2. Configure local secrets

```powershell
Copy-Item .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set a long random `JWT_SECRET`:

```text
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5000
```

The D1 database is bound as `DB` in `wrangler.jsonc`; there is no `MONGO_URI`.

### 3. Create the local D1 schema

```powershell
npm run db:setup
```

### 4. Optional demo data

```powershell
npm run seed
```

This creates the demo account plus 30 transactions across 4 months and 4 monthly budgets. It is repeatable — running it again replaces the demo user's data.

```text
Email:    demo@arthflow.app
Password: demo1234
```

### 5. Run the app

```powershell
npm run dev
```

- API + Worker: <http://localhost:5000>
- Frontend (Vite): <http://localhost:5173>

The frontend uses `VITE_API_URL` from `client/.env` in development. Keep:

```text
VITE_API_URL=http://localhost:5000/api
```

In production the frontend calls the same-origin `/api`, so `VITE_API_URL` is not needed.

---

## Deploy to Cloudflare

### 1. Log in

```powershell
npx wrangler login
```

### 2. Create the D1 database

```powershell
npx wrangler d1 create arthflow-db
```

Copy the returned `database_id` into `wrangler.jsonc`, replacing the placeholder:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "arthflow-db",
    "database_id": "REPLACE_WITH_THE_ID_FROM_WRANGLER"
  }
]
```

If you choose a different database name, update `database_name` too.

### 3. Apply the schema to the deployed database

```powershell
npm run db:setup:remote
```

### 4. Set the production JWT secret

Generate one:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then set it:

```powershell
npx wrangler secret put JWT_SECRET
```

Optional:

```powershell
npx wrangler secret put JWT_EXPIRES_IN   # default: 30d
npx wrangler secret put CLIENT_URL       # only if using a separate custom frontend domain
```

### 5. Deploy

```powershell
npm run deploy
```

Wrangler prints the live URL, for example `https://arthflow.<account>.workers.dev`.

### 6. Optional demo data in production

```powershell
npm run seed:remote
```

### 7. Verify

```text
https://<your-worker>.workers.dev/api/health
```

Expected:

```json
{ "status": "ok", "message": "ArthFlow API is running" }
```

Then open the site, register an account, or log in with the demo credentials if you seeded it.

Open a nested route such as `/transactions` directly — the Worker serves `index.html` for SPA routes.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run install:all` | Install root, server, and client dependencies |
| `npm run dev` | Run the Worker API and Vite frontend together |
| `npm run cf:dev` | Run only the Worker + local D1 on port 5000 |
| `npm run db:setup` | Apply `schema.sql` to local D1 |
| `npm run db:setup:remote` | Apply `schema.sql` to deployed D1 |
| `npm run seed` | Load repeatable demo data into local D1 |
| `npm run seed:remote` | Load demo data into deployed D1 |
| `npm run build` | Build the React production bundle |
| `npm run deploy:dry-run` | Build and validate the Worker bundle without deploying |
| `npm run deploy` | Build and deploy to Cloudflare |

---

## REST API

All protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account and default categories |
| POST | `/api/auth/login` | Log in and receive JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Acknowledge logout |
| GET | `/api/user/profile` | Get profile |
| PUT | `/api/user/profile` | Update name, email, opening balance |
| PUT | `/api/user/password` | Change password |
| GET | `/api/categories` | List categories, optional `?type=` |
| GET | `/api/categories/:id` | Get one category |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| POST | `/api/categories/restore-defaults` | Restore missing defaults |
| GET | `/api/transactions` | List with `type`, `month`, `year`, `startDate`, `endDate`, `search` |
| GET | `/api/transactions/:id` | Get one transaction |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/budget` | Budget + spending for a month |
| GET | `/api/budget/list` | Budget history |
| POST | `/api/budget` | Create or update monthly budget |
| PUT | `/api/budget/:id` | Update budget |
| DELETE | `/api/budget/:id` | Delete budget |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/reports` | Date-range report |

---

## Project structure

```text
.
├── client/                 React + Vite + Tailwind frontend
│   └── src/
│       ├── components/     Reusable UI
│       ├── context/        Auth and theme providers
│       ├── pages/          App screens
│       ├── services/       Axios API calls
│       └── utils/          Currency/date helpers
├── server/
│   ├── app.js              Express app factory
│   ├── worker.mjs          Cloudflare Worker entry point
│   ├── controllers/        Request handlers (D1 queries)
│   ├── db/
│   │   ├── schema.sql      D1 tables and indexes
│   │   └── store.js        Small parameterized SQL data layer
│   ├── middleware/         Auth, validation, error handling
│   ├── routes/             Express routes
│   └── utils/              Constants, dates, validation, seed
├── wrangler.jsonc          Worker assets, D1 binding, variables
├── .dev.vars.example       Local secret template
└── package.json            Root scripts
```

---

## Notes on D1

- D1 is Cloudflare's managed SQLite database. Free plan limits are generous for a personal app: 500 MB per database, 5 GB total, 5 million rows read/day, and 100,000 rows written/day.
- All queries are parameterized. Every user-scoped query includes `userId`.
- IDs are UUID strings stored in `_id`, matching the field name the frontend already uses.
- Dates are stored as ISO strings, matching the previous JSON date format.
- `server/db/seed.generated.sql` is generated by the seed script and gitignored.

## Troubleshooting

| Problem | Fix |
|---|---|
| `D1 database binding is not available` | Run `npm run cf:dev`, not `node server/server.js` |
| `Unknown database arthflow-db` | Check `database_name`/`database_id` in `wrangler.jsonc`, then run `npm run db:setup` |
| 401 on every protected route | `JWT_SECRET` missing or changed; set it again with `wrangler secret put JWT_SECRET` |
| CORS error in local dev | Set `CLIENT_URL=http://localhost:5000` in `.dev.vars` |
| Demo login fails on deployed site | Run `npm run seed:remote` |
| Deploy fails before using D1 | Make sure the placeholder `database_id` was replaced after `wrangler d1 create` |
