const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { monthKey, lastNMonths } = require('../utils/dateHelpers');

// GET /api/dashboard
// Every number here is calculated from the logged-in user's MongoDB transactions.
const getDashboard = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).lean();

    let totalIncome = 0;
    let totalExpenses = 0;
    const currentKey = monthKey(new Date());
    let monthIncome = 0;
    let monthExpenses = 0;
    let monthCount = 0;
    const categoryTotals = {};

    // Six-month chart buckets, oldest first
    const months = lastNMonths(6);
    const monthlyByKey = {};
    months.forEach((item) => { monthlyByKey[item.key] = { income: 0, expenses: 0 }; });

    transactions.forEach((item) => {
      const amount = item.amount;

      // Each transaction is counted exactly once, based on its type.
      if (item.type === 'income') totalIncome += amount;
      else totalExpenses += amount;

      const key = monthKey(item.date);
      if (monthlyByKey[key]) monthlyByKey[key][item.type] += amount;

      if (key === currentKey) {
        monthCount += 1;
        if (item.type === 'income') monthIncome += amount;
        else {
          monthExpenses += amount;
          categoryTotals[item.category] = (categoryTotals[item.category] || 0) + amount;
        }
      }
    });

    const expenseByCategory = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const now = new Date();
    const budget = await Budget.findOne({
      userId: req.user.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    const budgetAmount = budget ? budget.amount : 0;

    return res.json({
      totals: {
        totalIncome,
        totalExpenses,
        totalSavings: totalIncome - totalExpenses,
        openingBalance: req.user.openingBalance || 0,
        totalBalance: (req.user.openingBalance || 0) + totalIncome - totalExpenses,
      },
      currentMonth: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses,
        transactionCount: monthCount,
      },
      monthly: months.map((item) => ({
        label: item.label,
        month: item.month,
        year: item.year,
        income: monthlyByKey[item.key].income,
        expenses: monthlyByKey[item.key].expenses,
      })),
      expenseByCategory,
      recentTransactions,
      budget: {
        amount: budgetAmount,
        spent: monthExpenses,
        remaining: budget ? budgetAmount - monthExpenses : null,
        percentage: budgetAmount > 0 ? Math.round((monthExpenses / budgetAmount) * 100) : 0,
        isExceeded: Boolean(budget && monthExpenses > budgetAmount),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
