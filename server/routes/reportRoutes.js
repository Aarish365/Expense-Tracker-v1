const express = require('express');
const { getReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const { required, date, oneOf } = require('../utils/validation');

const router = express.Router();
router.use(protect);

router.get(
  '/',
  validateQuery({
    startDate: [required('Start date'), date],
    endDate: [required('End date'), date],
    type: [oneOf('Type', ['income', 'expense'])],
  }),
  getReport
);

module.exports = router;
