const express = require('express');
const {
  getBudget, listBudgets, upsertBudget, updateBudget, deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { required, amount, month, year } = require('../utils/validation');

const router = express.Router();
router.use(protect);

router.get(
  '/',
  validateQuery({ month: [month], year: [year] }),
  getBudget
);

router.get('/list', listBudgets);

router.post(
  '/',
  validate({
    month: [required('Month'), month],
    year: [required('Year'), year],
    amount: [required('Budget amount'), amount],
  }),
  upsertBudget
);

router.put(
  '/:id',
  validate({ amount: [required('Budget amount'), amount] }),
  updateBudget
);

router.delete('/:id', deleteBudget);

module.exports = router;
