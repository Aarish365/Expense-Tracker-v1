const bcrypt = require('bcryptjs');
const { dbOf, findUserByEmail, emailExists, createUser } = require('../db/store');
const generateToken = require('../utils/generateToken');
const { seedDefaultCategories } = require('../utils/defaultCategories');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  openingBalance: user.openingBalance,
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const db = dbOf(req);
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (await emailExists(db, normalizedEmail)) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(db, {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Every new account starts with the standard income/expense categories.
    await seedDefaultCategories(db, user._id);

    return res.status(201).json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const db = dbOf(req);
    const { email, password } = req.body;
    const user = await findUserByEmail(db, email.trim().toLowerCase(), true);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
const getMe = (req, res) => res.json({ user: req.user });

// POST /api/auth/logout (JWT lives on the client, so we simply acknowledge it)
const logout = (req, res) => res.json({ message: 'Logged out successfully' });

module.exports = { register, login, getMe, logout };
