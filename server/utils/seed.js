/*
 * Optional demo data. Run with: npm run seed
 * Everything is inserted into MongoDB through the same Mongoose models
 * used by the API - the application itself never reads static data.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const { seedDefaultCategories } = require('./defaultCategories');

const DEMO_EMAIL = 'demo@arthflow.app';
const DEMO_PASSWORD = 'demo1234';

// Simple sample transactions. Amounts are in rupees.
const MONTH_TEMPLATES = [
  [
    ['Salary - Acme Studio', 85000, 'income', 'Salary', 'Bank Transfer', 'Monthly salary'],
    ['Freelance logo design', 12000, 'income', 'Freelancing', 'UPI', 'Two small projects'],
    ['Monthly rent', 22000, 'expense', 'Rent', 'Bank Transfer', 'Apartment rent'],
    ['Groceries', 4500, 'expense', 'Food', 'UPI', 'Weekly grocery run'],
    ['Electricity bill', 1800, 'expense', 'Bills', 'UPI', ''],
    [' metro card', 1200, 'expense', 'Transport', 'UPI', 'Local travel'],
    ['Dinner with friends', 2100, 'expense', 'Food', 'Credit Card', ''],
    ['Netflix subscription', 649, 'expense', 'Entertainment', 'Credit Card', ''],
  ],
  [
    ['Salary - Acme Studio', 85000, 'income', 'Salary', 'Bank Transfer', 'Monthly salary'],
    ['Weekend trip to Goa', 14500, 'expense', 'Travel', 'Credit Card', 'Flights and stay'],
    ['Monthly rent', 22000, 'expense', 'Rent', 'Bank Transfer', 'Apartment rent'],
    ['Groceries', 5200, 'expense', 'Food', 'UPI', ''],
    ['New headphones', 4800, 'expense', 'Shopping', 'Debit Card', ''],
    ['Internet bill', 1200, 'expense', 'Bills', 'UPI', ''],
    ['Pharmacy', 950, 'expense', 'Healthcare', 'Cash', ''],
  ],
  [
    ['Salary - Acme Studio', 85000, 'income', 'Salary', 'Bank Transfer', 'Monthly salary'],
    ['Side project payment', 18000, 'income', 'Freelancing', 'UPI', ''],
    ['Monthly rent', 22000, 'expense', 'Rent', 'Bank Transfer', 'Apartment rent'],
    ['Groceries', 3900, 'expense', 'Food', 'UPI', ''],
    ['Online course', 3500, 'expense', 'Education', 'Credit Card', 'UI design course'],
    ['Petrol', 2400, 'expense', 'Transport', 'Debit Card', ''],
    ['Movie tickets', 900, 'expense', 'Entertainment', 'UPI', ''],
    ['Mobile bill', 799, 'expense', 'Bills', 'UPI', ''],
  ],
  [
    ['Salary - Acme Studio', 85000, 'income', 'Salary', 'Bank Transfer', 'Monthly salary'],
    ['Monthly rent', 22000, 'expense', 'Rent', 'Bank Transfer', 'Apartment rent'],
    ['Groceries', 6100, 'expense', 'Food', 'UPI', ''],
    ['New laptop stand', 2200, 'expense', 'Shopping', 'UPI', ''],
    ['Electricity bill', 2100, 'expense', 'Bills', 'UPI', ''],
    ['Gym membership', 2000, 'expense', 'Healthcare', 'Credit Card', ''],
    ['Coffee and snacks', 750, 'expense', 'Food', 'Cash', ''],
  ],
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email: DEMO_EMAIL });

    if (user) {
      // Make the seed repeatable: replace existing demo data.
      await Promise.all([
        Transaction.deleteMany({ userId: user._id }),
        Category.deleteMany({ userId: user._id }),
        Budget.deleteMany({ userId: user._id }),
      ]);
      user.name = 'Demo User';
      user.password = await bcrypt.hash(DEMO_PASSWORD, 10);
      user.openingBalance = 25000;
      await user.save();
    } else {
      user = await User.create({
        name: 'Demo User',
        email: DEMO_EMAIL,
        password: await bcrypt.hash(DEMO_PASSWORD, 10),
        openingBalance: 25000,
      });
    }

    await seedDefaultCategories(user._id);

    const transactions = [];
    const today = new Date();

    MONTH_TEMPLATES.forEach((rows, monthIndex) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (3 - monthIndex), 1);

      rows.forEach(([title, amount, type, category, paymentMethod, description], index) => {
        const day = Math.min(5 + index * 3, 28);
        transactions.push({
          userId: user._id,
          title: title.trim(),
          amount,
          type,
          category,
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
          paymentMethod,
          description,
        });
      });
    });

    await Transaction.insertMany(transactions);

    const budgets = MONTH_TEMPLATES.map((_, monthIndex) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (3 - monthIndex), 1);
      return {
        userId: user._id,
        month: monthDate.getMonth() + 1,
        year: monthDate.getFullYear(),
        amount: 45000,
      };
    });
    await Budget.insertMany(budgets);

    console.log('\nDemo data ready!');
    console.log(`  Email:    ${DEMO_EMAIL}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    console.log(`  ${transactions.length} transactions across 4 months\n`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
