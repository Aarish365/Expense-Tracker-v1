const { categoryKeys, insertCategories } = require('../db/store');
const { INCOME_CATEGORIES, EXPENSE_CATEGORIES } = require('./constants');

const categoryDocuments = () => [
  ...INCOME_CATEGORIES.map((name) => ({ name, type: 'income', isDefault: true })),
  ...EXPENSE_CATEGORIES.map((name) => ({ name, type: 'expense', isDefault: true })),
];

const missingDefaults = async (db, userId) => {
  const existing = await categoryKeys(db, userId);
  return categoryDocuments().filter(
    (item) => !existing.has(`${item.type}:${item.name.toLowerCase()}`)
  );
};

// Called once when a new account is created.
const seedDefaultCategories = async (db, userId) => {
  const missing = await missingDefaults(db, userId);
  if (missing.length > 0) await insertCategories(db, userId, missing);
  return missing.length;
};

// Called from "Restore defaults" in the UI: only inserts what is missing.
const ensureDefaultCategories = async (db, userId) => seedDefaultCategories(db, userId);

module.exports = { seedDefaultCategories, ensureDefaultCategories };
