const { dbOf, toISO, listTransactions } = require('../db/store');
const { monthKey, monthsBetween, parseInputDate } = require('../utils/dateHelpers');

// GET /api/reports?startDate=2026-01-01&endDate=2026-12-31&type=expense
const getReport = async (req, res) => {
  try {
    const start = parseInputDate(req.query.startDate);
    const end = parseInputDate(req.query.endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    const transactions = await listTransactions(dbOf(req), {
      userId: req.user.id,
      type: req.query.type,
      dateFrom: toISO(start),
      dateTo: toISO(end),
      dateToInclusive: true,
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory = {};
    const expenseByCategory = {};

    const months = monthsBetween(start, end);
    const monthlyByKey = {};
    months.forEach((item) => { monthlyByKey[item.key] = { income: 0, expenses: 0 }; });

    transactions.forEach((item) => {
      if (item.type === 'income') {
        totalIncome += item.amount;
        incomeByCategory[item.category] = (incomeByCategory[item.category] || 0) + item.amount;
      } else {
        totalExpenses += item.amount;
        expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + item.amount;
      }

      const key = monthKey(item.date);
      if (monthlyByKey[key]) monthlyByKey[key][item.type] += item.amount;
    });

    const toSortedArray = (object) => Object.entries(object)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return res.json({
      period: { startDate: req.query.startDate, endDate: req.query.endDate },
      totals: {
        totalIncome,
        totalExpenses,
        totalSavings: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      },
      monthly: months.map((item) => ({
        label: item.label,
        month: item.month,
        year: item.year,
        income: monthlyByKey[item.key].income,
        expenses: monthlyByKey[item.key].expenses,
      })),
      incomeByCategory: toSortedArray(incomeByCategory),
      expenseByCategory: toSortedArray(expenseByCategory),
      transactions,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = { getReport };
