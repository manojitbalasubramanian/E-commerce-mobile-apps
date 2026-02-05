require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Config & Database
const { connectDB } = require('./config/database');
const { PORT, FRONTEND_URL } = require('./config/constants');

// Models
const User = require('./models/User');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const invoiceRoutes = require('./routes/invoices');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(bodyParser.json());

// Store User model in app.locals for use in routes
app.locals.User = User;

// Connect to Database
connectDB();

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Error handler (optional)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Backend listening on port ${PORT}`);
});
