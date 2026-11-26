const bcrypt = require('bcrypt');
const User = require('../models/User');

// GET /api/user/profile
const getProfile = (req, res) => res.json({ user: req.user });

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, openingBalance } = req.body;
    const user = await User.findById(req.user.id);

    const emailTaken = await User.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: user._id },
    });
    if (emailTaken) {
      return res.status(400).json({ message: 'This email is already in use' });
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    if (openingBalance !== undefined) user.openingBalance = Number(openingBalance);
    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        openingBalance: user.openingBalance,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/user/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
