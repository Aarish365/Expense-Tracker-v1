export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (value) => String(value).padStart(2, '0');

// YYYY-MM-DD for HTML date inputs, using the local timezone.
export const toInputDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const todayInput = () => toInputDate(new Date());

export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export const formatMonthYear = (month, year) => `${MONTHS[month - 1]} ${year}`;

export const currentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const yearOptions = () => {
  const year = new Date().getFullYear();
  return [year - 2, year - 1, year, year + 1];
};

// First day of the month, N months ago (for default report ranges).
export const monthsAgoInput = (count) => {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth() - count, 1));
};
