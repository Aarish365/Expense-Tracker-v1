-- ArthFlow database schema for Cloudflare D1 (SQLite).
-- Apply with: npm run db:setup  (local) or npm run db:setup:remote

CREATE TABLE IF NOT EXISTS users (
  _id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password TEXT NOT NULL,
  openingBalance REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  _id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  isDefault INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (userId, name COLLATE NOCASE, type)
);

CREATE INDEX IF NOT EXISTS idx_categories_userId ON categories(userId);

CREATE TABLE IF NOT EXISTS transactions (
  _id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  paymentMethod TEXT NOT NULL DEFAULT 'Cash',
  description TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(userId, date DESC);

CREATE TABLE IF NOT EXISTS budgets (
  _id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  amount REAL NOT NULL CHECK (amount > 0),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (userId, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_userId ON budgets(userId);
