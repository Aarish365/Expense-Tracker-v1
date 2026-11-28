const {
  dbOf,
  toISO,
  listTransactions,
  getBudget,
  listBudgets,
  upsertBudget,
  updateBudget,
  deleteBudget,
} = require('../db/store');
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

const expensesForMonth = (db, userId, month, year) => {
  const { start, end } = monthRange(month, year);
  return listTransactions(db, {
    userId,
    type: 'expense',
    dateFrom: toISO(start),
    dateTo: toISO(end),
  });
};

// GET /api/budget?month=11&year=2026
const getBudgetHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const [budget, expenses] = await Promise.all([
      getBudget(db, req.user.id, month, year),
      expensesForMonth(db, req.user.id, month, year),
    ]);

    return res.json(withStats(budget, expenses, month, year));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/budget/list
const listBudgetsHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const [budgets, expenses] = await Promise.all([
      listBudgets(db, req.user.id),
      listTransactions(db, { userId: req.user.id, type: 'expense' }),
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
const upsertBudgetHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const { month, year, amount } = req.body;
    const nextMonth = Number(month);
    const nextYear = Number(year);

    const budget = await upsertBudget(db, req.user.id, nextMonth, nextYear, Number(amount));
    const expenses = await expensesForMonth(db, req.user.id, budget.month, budget.year);

    return res.status(201).json(withStats(budget, expenses, budget.month, budget.year));
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// PUT /api/budget/:id
const updateBudgetHandler = async (req, res) => {
  try {
    const db = dbOf(req);
    const budget = await updateBudget(db, req.params.id, req.user.id, {
      amount: Number(req.body.amount),
      month: req.body.month ? Number(req.body.month) : undefined,
      year: req.body.year ? Number(req.body.year) : undefined,
    });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    return res.json({ budget });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// DELETE /api/budget/:id
const deleteBudgetHandler = async (req, res) => {
  try {
    const deleted = await deleteBudget(dbOf(req), req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Budget not found' });
    return res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBudget: getBudgetHandler,
  listBudgets: listBudgetsHandler,
  upsertBudget: upsertBudgetHandler,
  updateBudget: updateBudgetHandler,
  deleteBudget: deleteBudgetHandler,
};
