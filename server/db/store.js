/*
 * Small D1 data layer.
 *
 * Controllers stay free of SQL and keep returning the same JSON documents the
 * frontend already expects (_id as a string, ISO dates, boolean isDefault).
 */
const crypto = require('crypto');

const newId = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();
const toISO = (date) => new Date(date).toISOString();
const changed = (result) => Number(result && result.meta && result.meta.changes ? result.meta.changes : 0);

const dbOf = (req) => {
  const db = req.app.locals.db;
  if (!db) throw new Error('D1 database binding is not available');
  return db;
};

const mapUser = (row, includePassword = false) => {
  if (!row) return null;
  const user = {
    _id: row._id,
    id: row._id,
    name: row.name,
    email: row.email,
    openingBalance: Number(row.openingBalance),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    __v: 0,
  };
  if (includePassword) user.password = row.password;
  return user;
};

const mapCategory = (row) => (row ? {
  _id: row._id,
  userId: row.userId,
  name: row.name,
  type: row.type,
  isDefault: Boolean(row.isDefault),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  __v: 0,
} : null);

const mapTransaction = (row) => (row ? {
  _id: row._id,
  userId: row.userId,
  title: row.title,
  amount: Number(row.amount),
  type: row.type,
  category: row.category,
  date: row.date,
  paymentMethod: row.paymentMethod,
  description: row.description,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  __v: 0,
} : null);

const mapBudget = (row) => (row ? {
  _id: row._id,
  userId: row.userId,
  month: Number(row.month),
  year: Number(row.year),
  amount: Number(row.amount),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  __v: 0,
} : null);

/* ------------------------------- users ---------------------------------- */

const findUserByEmail = async (db, email, includePassword = false) => {
  const row = await db
    .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
    .bind(String(email))
    .first();
  return mapUser(row, includePassword);
};

const findUserById = async (db, id, includePassword = false) => {
  const row = await db.prepare('SELECT * FROM users WHERE _id = ? LIMIT 1').bind(id).first();
  return mapUser(row, includePassword);
};

const emailExists = async (db, email, excludeId = '') => {
  const row = await db
    .prepare('SELECT 1 FROM users WHERE LOWER(email) = LOWER(?) AND _id <> ? LIMIT 1')
    .bind(String(email), excludeId || '')
    .first();
  return Boolean(row);
};

const createUser = async (db, { name, email, password, openingBalance = 0 }) => {
  const id = newId();
  const timestamp = nowISO();
  await db.prepare(`
    INSERT INTO users (_id, name, email, password, openingBalance, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, name, email, password, openingBalance, timestamp, timestamp).run();
  return findUserById(db, id);
};

const updateUser = async (db, id, fields = {}) => {
  const allowed = ['name', 'email', 'password', 'openingBalance'];
  const sets = ['updatedAt = ?'];
  const values = [nowISO()];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  });

  values.push(id);
  await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE _id = ?`).bind(...values).run();
  return findUserById(db, id);
};

/* ---------------------------- categories -------------------------------- */

const listCategories = async (db, userId, type) => {
  const params = [userId];
  let sql = 'SELECT * FROM categories WHERE userId = ?';
  if (type === 'income' || type === 'expense') {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY type ASC, name ASC';

  const { results } = await db.prepare(sql).bind(...params).all();
  return results.map(mapCategory);
};

const getCategory = async (db, id, userId) => {
  const row = await db
    .prepare('SELECT * FROM categories WHERE _id = ? AND userId = ? LIMIT 1')
    .bind(id, userId)
    .first();
  return mapCategory(row);
};

const findCategoryByName = async (db, userId, name, type, excludeId = '') => {
  const row = await db.prepare(`
    SELECT * FROM categories
    WHERE userId = ? AND type = ? AND LOWER(name) = LOWER(?) AND _id <> ?
    LIMIT 1
  `).bind(userId, type, String(name), excludeId || '').first();
  return mapCategory(row);
};

const categoryKeys = async (db, userId) => {
  const { results } = await db
    .prepare('SELECT name, type FROM categories WHERE userId = ?')
    .bind(userId)
    .all();
  return new Set(results.map((item) => `${item.type}:${item.name.toLowerCase()}`));
};

const createCategory = async (db, { userId, name, type, isDefault = false }) => {
  const id = newId();
  const timestamp = nowISO();
  await db.prepare(`
    INSERT INTO categories (_id, userId, name, type, isDefault, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, userId, name, type, isDefault ? 1 : 0, timestamp, timestamp).run();
  return getCategory(db, id, userId);
};

const insertCategories = async (db, userId, categories) => {
  const timestamp = nowISO();
  for (const category of categories) {
    await db.prepare(`
      INSERT INTO categories (_id, userId, name, type, isDefault, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(newId(), userId, category.name, category.type, category.isDefault ? 1 : 0, timestamp, timestamp).run();
  }
};

const updateCategory = async (db, id, userId, fields = {}) => {
  const allowed = ['name', 'type', 'isDefault'];
  const sets = ['updatedAt = ?'];
  const values = [nowISO()];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(key === 'isDefault' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  });

  values.push(id, userId);
  await db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE _id = ? AND userId = ?`)
    .bind(...values).run();
  return getCategory(db, id, userId);
};

const deleteCategory = async (db, id, userId) => {
  const result = await db
    .prepare('DELETE FROM categories WHERE _id = ? AND userId = ?')
    .bind(id, userId)
    .run();
  return changed(result);
};

/* ---------------------------- transactions ------------------------------ */

const escapeLike = (value) => String(value).replace(/[\\%_]/g, (char) => `\\${char}`);

const listTransactions = async (db, options = {}) => {
  const {
    userId,
    type,
    dateFrom,
    dateTo,
    dateToInclusive = false,
    search,
  } = options;

  const params = [userId];
  let sql = 'SELECT * FROM transactions WHERE userId = ?';

  if (type === 'income' || type === 'expense') {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (dateFrom) {
    sql += ' AND date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += dateToInclusive ? ' AND date <= ?' : ' AND date < ?';
    params.push(dateTo);
  }
  if (search && search.trim()) {
    sql += " AND LOWER(title) LIKE ? ESCAPE '\\'";
    params.push(`%${escapeLike(search.trim().toLowerCase())}%`);
  }

  sql += ' ORDER BY date DESC, createdAt DESC';
  const { results } = await db.prepare(sql).bind(...params).all();
  return results.map(mapTransaction);
};

const getTransaction = async (db, id, userId) => {
  const row = await db
    .prepare('SELECT * FROM transactions WHERE _id = ? AND userId = ? LIMIT 1')
    .bind(id, userId)
    .first();
  return mapTransaction(row);
};

const createTransaction = async (db, doc) => {
  const id = newId();
  const timestamp = nowISO();
  await db.prepare(`
    INSERT INTO transactions
      (_id, userId, title, amount, type, category, date, paymentMethod, description, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, doc.userId, doc.title, doc.amount, doc.type, doc.category,
    doc.date, doc.paymentMethod, doc.description, timestamp, timestamp
  ).run();
  return getTransaction(db, id, doc.userId);
};

const updateTransaction = async (db, id, userId, fields = {}) => {
  const allowed = ['title', 'amount', 'type', 'category', 'date', 'paymentMethod', 'description'];
  const sets = ['updatedAt = ?'];
  const values = [nowISO()];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  });

  values.push(id, userId);
  await db.prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE _id = ? AND userId = ?`)
    .bind(...values).run();
  return getTransaction(db, id, userId);
};

const deleteTransaction = async (db, id, userId) => {
  const result = await db
    .prepare('DELETE FROM transactions WHERE _id = ? AND userId = ?')
    .bind(id, userId)
    .run();
  return changed(result);
};

/* ------------------------------- budgets -------------------------------- */

const getBudget = async (db, userId, month, year) => {
  const row = await db.prepare(`
    SELECT * FROM budgets WHERE userId = ? AND month = ? AND year = ? LIMIT 1
  `).bind(userId, month, year).first();
  return mapBudget(row);
};

const listBudgets = async (db, userId) => {
  const { results } = await db
    .prepare('SELECT * FROM budgets WHERE userId = ? ORDER BY year DESC, month DESC')
    .bind(userId)
    .all();
  return results.map(mapBudget);
};

const upsertBudget = async (db, userId, month, year, amount) => {
  const id = newId();
  const timestamp = nowISO();
  await db.prepare(`
    INSERT INTO budgets (_id, userId, month, year, amount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userId, month, year)
    DO UPDATE SET amount = excluded.amount, updatedAt = excluded.updatedAt
  `).bind(id, userId, month, year, amount, timestamp, timestamp).run();
  return getBudget(db, userId, month, year);
};

const getBudgetById = async (db, id, userId) => {
  const row = await db
    .prepare('SELECT * FROM budgets WHERE _id = ? AND userId = ? LIMIT 1')
    .bind(id, userId)
    .first();
  return mapBudget(row);
};

const updateBudget = async (db, id, userId, fields = {}) => {
  const allowed = ['month', 'year', 'amount'];
  const sets = ['updatedAt = ?'];
  const values = [nowISO()];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  });

  values.push(id, userId);
  await db.prepare(`UPDATE budgets SET ${sets.join(', ')} WHERE _id = ? AND userId = ?`)
    .bind(...values).run();
  return getBudgetById(db, id, userId);
};

const deleteBudget = async (db, id, userId) => {
  const result = await db
    .prepare('DELETE FROM budgets WHERE _id = ? AND userId = ?')
    .bind(id, userId)
    .run();
  return changed(result);
};

module.exports = {
  newId,
  nowISO,
  toISO,
  dbOf,
  mapUser,
  mapCategory,
  mapTransaction,
  mapBudget,
  findUserByEmail,
  findUserById,
  emailExists,
  createUser,
  updateUser,
  listCategories,
  getCategory,
  findCategoryByName,
  categoryKeys,
  createCategory,
  insertCategories,
  updateCategory,
  deleteCategory,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudget,
  listBudgets,
  upsertBudget,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
