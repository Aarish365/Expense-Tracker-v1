const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "2026-11" style key, useful for grouping transactions by month.
const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Last N months including the current month, oldest first.
const lastNMonths = (count) => {
  const today = new Date();
  const months = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      key: monthKey(d),
      label: MONTH_NAMES[d.getMonth()].slice(0, 3),
    });
  }

  return months;
};

// Every month between two dates (oldest first), limited to 24 months.
const monthsBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];
  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end && months.length < 24) {
    months.push({
      month: current.getMonth() + 1,
      year: current.getFullYear(),
      key: monthKey(current),
      label: MONTH_NAMES[current.getMonth()].slice(0, 3),
    });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return months;
};

// Start/end Date objects for a given month and year.
const monthRange = (month, year) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 1),
});

// Parse "YYYY-MM-DD" from an HTML date input as a LOCAL date (avoids timezone shifts).
const parseInputDate = (value) => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
};

module.exports = {
  MONTH_NAMES, monthKey, lastNMonths, monthsBetween, monthRange, parseInputDate,
};
