const Category = require('../models/Category');
const { ensureDefaultCategories } = require('../utils/defaultCategories');

// GET /api/categories?type=expense
const getCategories = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.type === 'income' || req.query.type === 'expense') {
      filter.type = req.query.type;
    }

    const categories = await Category.find(filter).sort({ type: 1, name: 1 });
    return res.json({ count: categories.length, categories });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/categories/:id
const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    return res.json({ category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const name = req.body.name.trim();
    const type = req.body.type;

    const duplicate = await Category.findOne({
      userId: req.user.id,
      type,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (duplicate) {
      return res.status(400).json({ message: 'This category already exists' });
    }

    const category = await Category.create({ userId: req.user.id, name, type });
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const name = req.body.name.trim();
    const type = req.body.type || category.type;

    const duplicate = await Category.findOne({
      userId: req.user.id,
      type,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      _id: { $ne: category._id },
    });
    if (duplicate) {
      return res.status(400).json({ message: 'This category already exists' });
    }

    category.name = name;
    category.type = type;
    await category.save();

    return res.json({ category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/categories/restore-defaults
const restoreDefaults = async (req, res) => {
  try {
    const added = await ensureDefaultCategories(req.user.id);
    return res.json({
      message: added > 0 ? `${added} default categories restored` : 'All default categories are already present',
      added,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory, restoreDefaults,
};
