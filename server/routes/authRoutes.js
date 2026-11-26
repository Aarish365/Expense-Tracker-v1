const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { required, text, email, password } = require('../utils/validation');

const router = express.Router();

router.post(
  '/register',
  validate({
    name: [required('Name'), text('Name', 2, 60)],
    email: [required('Email'), email],
    password: [required('Password'), password],
  }),
  register
);

router.post(
  '/login',
  validate({
    email: [required('Email'), email],
    password: [required('Password')],
  }),
  login
);

router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
