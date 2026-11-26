const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { escapeRegex } = require('../utils/validation');
const { monthRange, parseInputDate } = require('../utils/dateHelpers');

// Check that the chosen category exists for this user and this transaction type.
const checkCategory = async (userId, name, type) => {
  const category = await Category.findOne({ userId, name, type });
  if (!category) {
    throw Object.assign(new Error(`"${name}" is not a saved ${type} category`), { status: 400 });
  }
};

// Build a MongoDB filter from the query string.
const buildFilter = (req) => {
  const filter = { userId: req.user.id };

  if (req.query.type === 'income' || req.query.type === 'expense') {
    filter.type = req.query.type;
  }

  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (month >= 1 && month <= 12 && year >= 2000) {
    const { start, end } = monthRange(month, year);
    filter.date = { $gte: start, $lt: end };
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = filter.date || {};
    if (req.query.startDate) filter.date.$gte = parseInputDate(req.query.startDate);
    if (req.query.endDate) {
      const end = parseInputDate(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (req.query.search && req.query.search.trim()) {
    filter.title = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
  }

  return filter;
};

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find(buildFilter(req))
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.json({ count: transactions.length, transactions });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// GET /api/transactions/:id
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    return res.json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, paymentMethod, description } = req.body;

    await checkCategory(req.user.id, category, type);

    const transaction = await Transaction.create({
      userId: req.user.id,
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date: parseInputDate(req.body.date),
      paymentMethod: paymentMethod ? paymentMethod.trim() : 'Cash',
      description: description ? description.trim() : '',
    });

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const { title, amount, type, category, date, paymentMethod, description } = req.body;
    const nextType = type || transaction.type;
    const nextCategory = category || transaction.category;

    await checkCategory(req.user.id, nextCategory, nextType);

    transaction.title = title.trim();
    transaction.amount = Number(amount);
    transaction.type = nextType;
    transaction.category = nextCategory;
    transaction.date = parseInputDate(date);
    transaction.paymentMethod = paymentMethod ? paymentMethod.trim() : transaction.paymentMethod;
    transaction.description = description ? description.trim() : '';
    await transaction.save();

    return res.json({ transaction });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    return res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction,
};
