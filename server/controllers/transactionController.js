const {
  dbOf,
  toISO,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  findCategoryByName,
} = require('../db/store');
const { monthRange, parseInputDate } = require('../utils/dateHelpers');

// Check that the chosen category exists for this user and this transaction type.
const checkCategory = async (db, userId, name, type) => {
  const category = await findCategoryByName(db, userId, name, type);
  if (!category) {
    throw Object.assign(new Error(`"${name}" is not a saved ${type} category`), { status: 400 });
  }
};

// Build D1 query options from the query string.
const buildFilter = (req) => {
  const options = { userId: req.user.id };

  if (req.query.type === 'income' || req.query.type === 'expense') {
    options.type = req.query.type;
  }

  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (month >= 1 && month <= 12 && year >= 2000) {
    const { start, end } = monthRange(month, year);
    options.dateFrom = toISO(start);
    options.dateTo = toISO(end);
  }

  if (req.query.startDate || req.query.endDate) {
    if (req.query.startDate) {
      options.dateFrom = toISO(parseInputDate(req.query.startDate));
    }
    if (req.query.endDate) {
      const end = parseInputDate(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      options.dateTo = toISO(end);
      options.dateToInclusive = true;
    }
  }

  if (req.query.search && req.query.search.trim()) {
    options.search = req.query.search.trim();
  }

  return options;
};

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await listTransactions(dbOf(req), buildFilter(req));
    return res.json({ count: transactions.length, transactions });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res) => {
  try {
    const transaction = await getTransaction(dbOf(req), req.params.id, req.user.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    return res.json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/transactions
const createTransactionHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const { title, amount, type, category, paymentMethod, description } = req.body;

    await checkCategory(db, req.user.id, category, type);

    const transaction = await createTransaction(db, {
      userId: req.user.id,
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date: toISO(parseInputDate(req.body.date)),
      paymentMethod: paymentMethod ? paymentMethod.trim() : 'Cash',
      description: description ? description.trim() : '',
    });

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// PUT /api/transactions/:id
const updateTransactionHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const transaction = await getTransaction(db, req.params.id, req.user.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const { title, amount, type, category, date, paymentMethod, description } = req.body;
    const nextType = type || transaction.type;
    const nextCategory = category || transaction.category;

    await checkCategory(db, req.user.id, nextCategory, nextType);

    const updated = await updateTransaction(db, transaction._id, req.user.id, {
      title: title.trim(),
      amount: Number(amount),
      type: nextType,
      category: nextCategory,
      date: date ? toISO(parseInputDate(date)) : undefined,
      paymentMethod: paymentMethod ? paymentMethod.trim() : transaction.paymentMethod,
      description: description ? description.trim() : '',
    });

    return res.json({ transaction: updated });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// DELETE /api/transactions/:id
const deleteTransactionHandler = async (req, res) => {
  try {
    const deleted = await deleteTransaction(dbOf(req), req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    return res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  getTransaction: getTransactionById,
  createTransaction: createTransactionHandler,
  updateTransaction: updateTransactionHandler,
  deleteTransaction: deleteTransactionHandler,
};
