const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Counter = require('./models/Counter');
const Invoice = require('./models/Invoice');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/consultancy';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ===== AUTHENTICATION MIDDLEWARE =====
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Role-based access control middleware
async function checkRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join(' or ') });
      }
      
      req.user = user;
      next();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}

// ===== PRODUCTS ROUTES =====

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().populate('createdBy', 'name email');
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add new product (Admin only)
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add products' });
    }

    const { name, brand, price, description, stock, image } = req.body;

    if (!name || !brand || price === undefined) {
      return res.status(400).json({ error: 'Name, brand, and price are required' });
    }

    // Generate sequential productId (zero-padded to 13 digits) using counter
    const counter = await Counter.findOneAndUpdate(
      { _id: 'productId' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const seq = counter.seq || 1;
    const productId = String(seq).padStart(13, '0');

    const product = new Product({
      name,
      brand,
      price,
      description,
      stock: stock || 0,
      image,
      productId,
      createdBy: req.userId
    });

    await product.save();
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update product (Admin only)
app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update products' });
    }

    const { name, brand, price, description, stock, image } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, brand, price, description, stock, image, updatedAt: new Date() },
      { new: true }
    );

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete products' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== CHECKOUT & INVOICES ROUTES =====

// Create invoice from checkout
app.post('/api/checkout', verifyToken, async (req, res) => {
  try {
    const { cart, customer } = req.body;
    if (!cart || !cart.length) return res.status(400).json({ error: 'empty cart' });

    const user = await User.findById(req.userId);

    // Normalize cart items to ensure `productId` is present for each item
    const items = [];
    for (const entry of cart) {
      const pid = entry.productId || entry._id || entry.id;
      if (!pid) return res.status(400).json({ error: 'Each cart item must include a product id' });

      const prod = await Product.findById(pid);
      if (!prod) return res.status(404).json({ error: `Product not found: ${pid}` });

      const quantity = parseInt(entry.quantity, 10) || 1;
      const price = typeof entry.price === 'number' ? entry.price : prod.price || 0;

      items.push({
        productId: prod._id,
        name: prod.name,
        price,
        quantity
      });
    }

    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = new Invoice({
      invoiceNumber,
      userId: req.userId,
      items,
      total,
      customerName: customer?.name || user.name,
      customerEmail: customer?.email || user.email
    });

    await invoice.save();
    res.status(201).json({ invoice });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all invoices for logged-in user
app.get('/api/invoices', verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId }).populate('items.productId');
    res.json({ invoices });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single invoice
app.get('/api/invoices/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice || invoice.userId.toString() !== req.userId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ invoice });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generate and download invoice as PDF
app.get('/api/invoices/:id/pdf', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice || invoice.userId.toString() !== req.userId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Mobile Shop', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Professional billing & stock management', { align: 'center' });
    doc.moveDown(1);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Invoice details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 50, 150);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50, 170);
    doc.moveDown(1);

    // Customer info
    doc.fontSize(11).font('Helvetica-Bold').text('Customer Information:', 50);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${invoice.customerName || 'N/A'}`, 50);
    doc.text(`Email: ${invoice.customerEmail || 'N/A'}`, 50);
    doc.moveDown(1);

    // Items table
    doc.fontSize(11).font('Helvetica-Bold').text('Items Purchased:', 50);
    doc.moveDown(0.5);

    // Table header
    const startY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Product', 50, startY);
    doc.text('Qty', 250, startY);
    doc.text('Price', 300, startY);
    doc.text('Total', 380, startY);

    doc.moveTo(50, startY + 15).lineTo(500, startY + 15).stroke();
    doc.moveDown(0.8);

    // Items
    doc.font('Helvetica').fontSize(9);
    invoice.items.forEach(item => {
      const y = doc.y;
      doc.text(item.name || 'Product', 50, y);
      doc.text(String(item.quantity), 250, y);
      doc.text(`$${item.price.toFixed(2)}`, 300, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 380, y);
      doc.moveDown(0.6);
    });

    // Total
    const totalY = doc.y;
    doc.moveTo(50, totalY - 5).lineTo(500, totalY - 5).stroke();
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Total Amount:', 50, doc.y);
    doc.text(`$${invoice.total.toFixed(2)}`, 380, doc.y - 15);

    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text('Thank you for your purchase!', { align: 'center' });

    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== AUTHENTICATION ROUTES =====

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (default role is 'user')
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign({ id: newUser._id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Signin successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Logout (client-side, but can be used for token invalidation if needed)
app.post('/api/auth/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
