# ArthFlow

A simple, beginner-friendly **Personal Finance Tracker** built with the MERN stack. Track income, expenses, categories, monthly budgets and reports — all stored in MongoDB and served through real REST APIs.

Everything is displayed in **Indian Rupees (₹)** using `Intl.NumberFormat('en-IN', ...)`.

---

## Features

- **Authentication** — register, log in, log out, JWT-protected routes, bcrypt password hashing
- **Dashboard** — total balance, income, expenses and savings, 6-month bar chart, expense pie chart, recent transactions, current-month overview
- **Transactions** — add income/expense, edit, delete, search by title, filter by type and month/year
- **Categories** — 14 default categories created with each account, plus custom categories (add/edit/delete/restore defaults)
- **Budget** — monthly budget, spending, remaining amount, progress bar and over-budget warning
- **Reports** — date-range filter, income and expense reports, category charts, income vs expense chart
- **Profile & Settings** — update name/email/opening balance, change password, theme toggle, logout
- **Responsive UI** — desktop sidebar, mobile drawer, cards instead of tables on small screens
- **Dark mode** — optional, saved in local storage

---

## Tech stack

| Frontend | Backend | Database |
| --- | --- | --- |
| React 18 + Vite | Node.js + Express | MongoDB + Mongoose |
| Tailwind CSS | JWT authentication | |
| Axios | bcryptjs | |
| Recharts | Separate routes/controllers/middleware | |
| Lucide React | | |

---

## Installation

### 1. Requirements

- Node.js 20.19 or newer (Mongoose 9 requirement)
- npm
- MongoDB running locally **or** a MongoDB Atlas connection string

### 2. Install dependencies

From the project root:

```bash
npm run install:all
```

This installs the root tools plus `server/` and `client/` dependencies.

### 3. Configure environment variables

Copy the example files and edit them:

```bash
# Windows PowerShell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

`server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/arthflow
JWT_SECRET=replace_this_with_a_long_random_secret_key
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string (include the database name).

`client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

> Use a long, random `JWT_SECRET` in production.

### 4. Start the app

```bash
npm run dev
```

This runs both servers:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

Open the frontend, click **Create an account**, and start using ArthFlow.

---

## Demo data (optional)

To load a demo account with 30+ transactions across 4 months, categories and budgets:

```bash
npm run seed
```

Then log in with:

```
Email:    demo@arthflow.app
Password: demo1234
```

The seed script only inserts sample records when you run it. The application itself always reads real data from MongoDB through the API — there is no static data in the UI.

---

## Deploy to Cloudflare (frontend + API in one Worker)

The React build and the Express API are served by a single Cloudflare Worker:

- `https://<your-worker>.workers.dev/` → React app
- `https://<your-worker>.workers.dev/api/...` → REST API

The production build calls `/api` on the same origin, so **`VITE_API_URL` is not needed in production**.

### 1. Create a free MongoDB Atlas cluster

1. Sign up at <https://www.mongodb.com/atlas> and create a project.
2. Click **Create** → **Shared / M0 Free**, choose a cloud provider and region, then create the cluster.
3. **Database Access** → **Add new database user** → choose **Password** authentication. Use a strong password and the role **Read and write to any database**. Save the password.
4. **Network Access** → **Add IP Address** → add `0.0.0.0/0` so Cloudflare Workers can reach the cluster, then confirm. (Keep the database user password strong.)
5. **Connect** → **Drivers** → **Node.js** → copy the connection string. It looks like:

   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Insert your database name after `.mongodb.net/`:

   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/arthflow?retryWrites=true&w=majority
   ```

   If the password contains special characters, URL-encode them.

### 2. Deploy the Worker

From the project root:

```bash
npm install
npx wrangler login

npx wrangler secret put MONGO_URI      # paste the Atlas URI from step 1
npx wrangler secret put JWT_SECRET     # a long random string, e.g. from a password generator

npm run deploy
```

Wrangler prints the live URL, for example `https://arthflow.<account>.workers.dev`.

> Set both secrets **before** the first deploy — the Worker connects to MongoDB when it starts.

Optional extras:

```bash
npx wrangler secret put JWT_EXPIRES_IN  # default: 30d
npx wrangler secret put CLIENT_URL      # only needed for a separate custom frontend domain
```

### 3. Verify

1. Open `https://<your-worker>.workers.dev/api/health` — it should return `{"status":"ok"}`.
2. Open the site and register an account, or load demo data into Atlas from your machine:

   ```bash
   # PowerShell, from the project root
   $env:MONGO_URI = "mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/arthflow?retryWrites=true&w=majority"
   npm run seed
   ```

   Then log in with `demo@arthflow.app` / `demo1234`. Your local IP must be allowed in Atlas Network Access for this step.

### 4. Local Worker test (optional)

```bash
Copy-Item .dev.vars.example .dev.vars   # fill in MONGO_URI / JWT_SECRET
npm run cf:dev
```

This runs the same Worker bundle locally (default <http://localhost:8787>) using `.dev.vars`. It is gitignored.

---

## Available scripts

Run these from the project root:

| Command | Description |
| --- | --- |
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Start server + client together |
| `npm run dev:server` | Start only the backend (port 5000) |
| `npm run dev:client` | Start only the frontend (port 5173) |
| `npm run seed` | Insert demo data |
| `npm run build` | Build the production frontend |
| `npm start` | Start the backend in production mode |
| `npm run cf:dev` | Test the Cloudflare Worker locally (needs `.dev.vars`) |
| `npm run deploy:dry-run` | Build and validate the Worker bundle without uploading |
| `npm run deploy` | Build and deploy frontend + API to Cloudflare |

---

## Balance calculations

Each transaction is counted exactly once according to its `type`:

```text
Total Income   = sum of all income transactions
Total Expenses = sum of all expense transactions
Total Savings  = Total Income - Total Expenses
Total Balance  = Opening Balance + Total Income - Total Expenses
```

The **Opening Balance** can be edited on the Profile & Settings page. All budgets, charts and reports are calculated from stored transactions.

---

## API overview

All routes except auth register/login require `Authorization: Bearer <jwt>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account (also creates default categories) |
| POST | `/api/auth/login` | Log in, receive JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout acknowledgement |
| GET | `/api/user/profile` | Get profile |
| PUT | `/api/user/profile` | Update name, email, opening balance |
| PUT | `/api/user/password` | Change password |
| GET | `/api/transactions` | List with `type`, `month`, `year`, `search`, `startDate`, `endDate` |
| GET | `/api/transactions/:id` | Get one transaction |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/categories` | List categories (optional `type`) |
| GET/POST | `/api/categories`, `/api/categories/:id` | Category CRUD |
| POST | `/api/categories/restore-defaults` | Add missing default categories |
| GET | `/api/budget?month=&year=` | Budget + spending + remaining for a month |
| GET | `/api/budget/list` | All saved budgets |
| POST | `/api/budget` | Create/update a monthly budget |
| PUT/DELETE | `/api/budget/:id` | Update/delete a budget |
| GET | `/api/dashboard` | All dashboard statistics |
| GET | `/api/reports?startDate=&endDate=&type=` | Report for a date range |

Every database query is scoped to `req.user.id`, so users can only see and change their own data.

---

## Project structure

```text
arthflow/
├── client/
│   └── src/
│       ├── components/   Reusable UI (cards, charts, forms, lists, modal…)
│       ├── pages/        Login, Dashboard, Transactions, Categories, Budget, Reports, Profile
│       ├── layouts/      MainLayout (sidebar/header) and AuthLayout
│       ├── hooks/        useAsync
│       ├── services/     Axios instance + one service per API resource
│       ├── context/      Auth, Theme and Toast contexts
│       └── utils/        Currency, date and chart constants
├── server/
│   ├── config/           MongoDB connection
│   ├── models/           User, Transaction, Category, Budget
│   ├── controllers/      Request handling and calculations
│   ├── routes/           REST endpoints
│   ├── middleware/       JWT protection, validation, error handling
│   ├── utils/            Helpers and demo seed script
│   ├── app.js            Express app factory (shared by Node and Worker)
│   ├── server.js         Local/production Node entry point
│   └── worker.mjs        Cloudflare Worker entry point
├── server/.env.example
├── client/.env.example
├── wrangler.jsonc        Cloudflare Worker + assets config
├── .dev.vars.example     Local Worker secrets template
└── README.md
```

---

## Troubleshooting

- **Backend cannot connect to MongoDB** — check `MONGO_URI` in `server/.env` and make sure MongoDB is running.
- **Frontend shows network errors** — make sure the backend is running and `VITE_API_URL` in `client/.env` points to it. Restart Vite after changing `.env`.
- **Charts look empty on a new account** — add a few transactions; all charts are generated from real MongoDB data.
