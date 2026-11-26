/*
 * Small validation middleware. Each rule is a function that returns an error
 * message (string) or null.
 *
 * Usage: validate({ title: [required('Title'), text('Title', 2, 100)] })
 */
const runRules = (rules, values) => {
  const errors = [];

  Object.entries(rules).forEach(([field, validators]) => {
    validators.forEach((validator) => {
      const error = validator(values[field]);
      if (error && !errors.includes(error)) errors.push(error);
    });
  });

  return errors;
};

const sendErrors = (errors, res) =>
  res.status(400).json({ message: errors[0], errors });

const validate = (rules) => (req, res, next) => {
  const errors = runRules(rules, req.body || {});
  return errors.length > 0 ? sendErrors(errors, res) : next();
};

// Same idea for query strings: ?month=11&year=2026
const validateQuery = (rules) => (req, res, next) => {
  const errors = runRules(rules, req.query || {});
  return errors.length > 0 ? sendErrors(errors, res) : next();
};

module.exports = { validate, validateQuery };
