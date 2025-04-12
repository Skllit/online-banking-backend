/* server.js */
require('dotenv').config(); // Load .env variables

const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const fundTransferRoutes = require('./routes/fundTransfer');
const adminRoutes = require('./routes/admin');
const connectDB = require('./config/db');

connectDB(); // Connect to MongoDB

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));

// Mount API routes (all endpoints are prefixed with /api)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transfer', fundTransferRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: '404: Resource not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error encountered:', err);
  res.status(500).json({ error: '500: Internal Server Error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
