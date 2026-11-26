const express = require('express');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { required, text, email, password, nonNegativeAmount } = require('../utils/validation');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);

router.put(
  '/profile',
  validate({
    name: [required('Name'), text('Name', 2, 60)],
    email: [required('Email'), email],
    openingBalance: [nonNegativeAmount],
  }),
  updateProfile
);

router.put(
  '/password',
  validate({
    currentPassword: [required('Current password')],
    newPassword: [required('New password'), password],
  }),
  changePassword
);

module.exports = router;
