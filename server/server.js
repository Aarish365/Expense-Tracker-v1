require('dotenv').config();

const connectDB = require('./config/db');
const createApp = require('./app');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  createApp().listen(PORT, () => {
    console.log(`ArthFlow server running on http://localhost:${PORT}`);
  });
});
