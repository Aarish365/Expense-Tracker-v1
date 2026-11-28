const {
  dbOf,
  listCategories,
  getCategory,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../db/store');
const { ensureDefaultCategories } = require('../utils/defaultCategories');

// GET /api/categories?type=expense
const getCategories = async (req, res) => {
  try {
    const db = dbOf(req);
    const type = req.query.type === 'income' || req.query.type === 'expense' ? req.query.type : undefined;
    const categories = await listCategories(db, req.user.id, type);
    return res.json({ count: categories.length, categories });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await getCategory(dbOf(req), req.params.id, req.user.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    return res.json({ category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/categories
const createCategoryHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const name = req.body.name.trim();
    const type = req.body.type;

    if (await findCategoryByName(db, req.user.id, name, type)) {
      return res.status(400).json({ message: 'This category already exists' });
    }

    const category = await createCategory(db, { userId: req.user.id, name, type });
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/categories/:id
const updateCategoryHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const category = await getCategory(db, req.params.id, req.user.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const name = req.body.name.trim();
    const type = req.body.type || category.type;

    if (await findCategoryByName(db, req.user.id, name, type, category._id)) {
      return res.status(400).json({ message: 'This category already exists' });
    }

    const updated = await updateCategory(db, category._id, req.user.id, { name, type });
    return res.json({ category: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/categories/:id
const deleteCategoryHandler = async (req, res) => {
  try {
    const deleted = await deleteCategory(dbOf(req), req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/categories/restore-defaults
const restoreDefaults = async (req, res) => {
  try {
    const added = await ensureDefaultCategories(dbOf(req), req.user.id);
    return res.json({
      message: added > 0 ? `${added} default categories restored` : 'All default categories are already present',
      added,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getCategory: getCategoryById,
  createCategory: createCategoryHandler,
  updateCategory: updateCategoryHandler,
  deleteCategory: deleteCategoryHandler,
  restoreDefaults,
};
