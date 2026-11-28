const bcrypt = require('bcryptjs');
const {
  dbOf, findUserById, emailExists, updateUser,
} = require('../db/store');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  openingBalance: user.openingBalance,
});

// GET /api/user/profile
const getProfile = (req, res) => res.json({ user: req.user });

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const db = dbOf(req);
    const { name, email, openingBalance } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (await emailExists(db, normalizedEmail, req.user.id)) {
      return res.status(400).json({ message: 'This email is already in use' });
    }

    const user = await updateUser(db, req.user.id, {
      name: name.trim(),
      email: normalizedEmail,
      openingBalance: openingBalance !== undefined ? Number(openingBalance) : undefined,
    });

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/user/password
const changePassword = async (req, res) => {
  try {
    const db = dbOf(req);
    const { currentPassword, newPassword } = req.body;
    const user = await findUserById(db, req.user.id, true);

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    await updateUser(db, req.user.id, { password: await bcrypt.hash(newPassword, 10) });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
