const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { monthRange, monthKey } = require('../utils/dateHelpers');

// Shared calculation so the Budget and Dashboard pages show the same numbers.
const withStats = (budget, expenses, month, year) => {
  const spending = expenses.reduce((sum, item) => sum + item.amount, 0);
  const amount = budget ? budget.amount : 0;

  return {
    budget,
    month,
    year,
    spending,
    remaining: budget ? amount - spending : null,
    percentage: amount > 0 ? Math.round((spending / amount) * 100) : 0,
    isExceeded: Boolean(budget && spending > amount),
  };
};

// GET /api/budget?month=11&year=2026
const getBudget = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const { start, end } = monthRange(month, year);

    const [budget, expenses] = await Promise.all([
      Budget.findOne({ userId: req.user.id, month, year }),
      Transaction.find({ userId: req.user.id, type: 'expense', date: { $gte: start, $lt: end } })
        .select('amount'),
    ]);

    return res.json(withStats(budget, expenses, month, year));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/budget/list
const listBudgets = async (req, res) => {
  try {
    const [budgets, expenses] = await Promise.all([
      Budget.find({ userId: req.user.id }).sort({ year: -1, month: -1 }),
      Transaction.find({ userId: req.user.id, type: 'expense' }).select('amount date'),
    ]);

    const spendingByMonth = {};
    expenses.forEach((item) => {
      const key = monthKey(item.date);
      spendingByMonth[key] = (spendingByMonth[key] || 0) + item.amount;
    });

    const result = budgets.map((budget) => withStats(
      budget,
      [{ amount: spendingByMonth[`${budget.year}-${String(budget.month).padStart(2, '0')}`] || 0 }],
      budget.month,
      budget.year
    ));

    return res.json({ count: result.length, budgets: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/budget (creates or updates the budget for a month)
const upsertBudget = async (req, res) => {
  try {
    const { month, year, amount } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user.id, month: Number(month), year: Number(year) },
      { $set: { amount: Number(amount) } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const { start, end } = monthRange(budget.month, budget.year);
    const expenses = await Transaction.find({
      userId: req.user.id,
      type: 'expense',
      date: { $gte: start, $lt: end },
    }).select('amount');

    return res.status(201).json(withStats(budget, expenses, budget.month, budget.year));
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// PUT /api/budget/:id
const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    budget.amount = Number(req.body.amount);
    if (req.body.month) budget.month = Number(req.body.month);
    if (req.body.year) budget.year = Number(req.body.year);
    await budget.save();

    return res.json({ budget });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// DELETE /api/budget/:id
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    return res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getBudget, listBudgets, upsertBudget, updateBudget, deleteBudget };
