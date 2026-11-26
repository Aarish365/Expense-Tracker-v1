const express = require('express');
const {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory, restoreDefaults,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { required, text, oneOf } = require('../utils/validation');

const router = express.Router();
router.use(protect);

const categoryRules = {
  name: [required('Category name'), text('Category name', 1, 40)],
  type: [required('Type'), oneOf('Type', ['income', 'expense'])],
};

router.get('/', validateQuery({ type: [oneOf('Type', ['income', 'expense'])] }), getCategories);
router.post('/restore-defaults', restoreDefaults);
router.get('/:id', getCategory);
router.post('/', validate(categoryRules), createCategory);
router.put('/:id', validate(categoryRules), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
