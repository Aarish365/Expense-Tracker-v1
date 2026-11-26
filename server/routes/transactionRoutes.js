const express = require('express');
const {
  getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const {
  required, text, amount, oneOf, date, month, year,
} = require('../utils/validation');
const { PAYMENT_METHODS } = require('../utils/constants');

const router = express.Router();
router.use(protect);

const transactionRules = {
  title: [required('Title'), text('Title', 2, 100)],
  amount: [required('Amount'), amount],
  type: [required('Type'), oneOf('Type', ['income', 'expense'])],
  category: [required('Category'), text('Category', 1, 40)],
  date: [required('Date'), date],
  paymentMethod: [required('Payment method'), oneOf('Payment method', PAYMENT_METHODS)],
  description: [text('Description', 0, 500)],
};

router.get(
  '/',
  validateQuery({
    type: [oneOf('Type', ['income', 'expense'])],
    month: [month],
    year: [year],
    startDate: [date],
    endDate: [date],
  }),
  getTransactions
);

router.get('/:id', getTransaction);
router.post('/', validate(transactionRules), createTransaction);
router.put('/:id', validate(transactionRules), updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
