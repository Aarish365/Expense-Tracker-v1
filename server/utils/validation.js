/*
 * Tiny validation helpers. Each helper returns an error message (string)
 * when the value is invalid, or null when it is fine.
 */

const required = (label) => (value) => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return `${label} is required`;
  }
  return null;
};

const text = (label, min = 1, max = 100) => (value) => {
  if (value === undefined || value === null || value === '') return null; // optional unless "required" is used
  if (typeof value !== 'string') return `${label} must be text`;
  const length = value.trim().length;
  if (length < min || length > max) return `${label} must be between ${min} and ${max} characters`;
  return null;
};

const email = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

const password = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.length < 6 || value.length > 100) {
    return 'Password must be between 6 and 100 characters';
  }
  return null;
};

const amount = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 'Amount must be greater than 0';
  if (number > 1000000000000) return 'Amount is too large';
  return null;
};

// Allows 0 (unlike amount(), which requires a value greater than 0).
const nonNegativeAmount = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 'Value cannot be negative';
  return null;
};

const oneOf = (label, options) => (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (!options.includes(value)) return `${label} must be one of: ${options.join(', ')}`;
  return null;
};

const date = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Please enter a valid date';
  return null;
};

const month = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 12) return 'Month must be between 1 and 12';
  return null;
};

const year = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 2000 || number > 2100) return 'Year must be between 2000 and 2100';
  return null;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  required, text, email, password, amount, nonNegativeAmount, oneOf, date, month, year, escapeRegex,
};
