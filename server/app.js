const express = require('express');
const cors = require('cors');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Returns a fresh Express app. Used by both server.js (Node) and worker.mjs (Cloudflare).
const createApp = () => {
  const app = express();

  // Allow the configured frontend plus the current host (same-origin on Cloudflare).
  app.use(cors((req, callback) => {
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim());

    if (req.headers.host) {
      allowedOrigins.push(`http://${req.headers.host}`, `https://${req.headers.host}`);
    }

    callback(null, {
      origin: (origin, allow) => {
        // Requests without Origin (same-origin GETs, curl) are fine too.
        if (!origin || allowedOrigins.includes(origin)) return allow(null, true);
        return allow(new Error('Not allowed by CORS'));
      },
      credentials: true,
    });
  }));

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'ArthFlow API is running' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/budget', budgetRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
