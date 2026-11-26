const Category = require('../models/Category');
const { INCOME_CATEGORIES, EXPENSE_CATEGORIES } = require('./constants');

const categoryDocuments = (userId) => [
  ...INCOME_CATEGORIES.map((name) => ({ userId, name, type: 'income', isDefault: true })),
  ...EXPENSE_CATEGORIES.map((name) => ({ userId, name, type: 'expense', isDefault: true })),
];

// Called once when a new account is created.
const seedDefaultCategories = (userId) => Category.insertMany(categoryDocuments(userId));

// Called from "Restore defaults" in the UI: only inserts what is missing.
const ensureDefaultCategories = async (userId) => {
  const existing = await Category.find({ userId }).select('name type');
  const existingKeys = existing.map((item) => `${item.type}:${item.name}`);
  const missing = categoryDocuments(userId).filter(
    (item) => !existingKeys.includes(`${item.type}:${item.name}`)
  );

  if (missing.length > 0) await Category.insertMany(missing);
  return missing.length;
};

module.exports = { seedDefaultCategories, ensureDefaultCategories };
