const express = require('express');
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create invoice from checkout
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { cart, customer } = req.body;
    if (!cart || !cart.length) return res.status(400).json({ error: 'empty cart' });

    const user = await req.app.locals.User.findById(req.userId);

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
router.get('/', verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId }).populate('items.productId');
    res.json({ invoices });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single invoice
router.get('/:id', verifyToken, async (req, res) => {
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
router.get('/:id/pdf', verifyToken, async (req, res) => {
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
      doc.text(`₹${item.price.toFixed(2)}`, 300, y);
      doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 380, y);
      doc.moveDown(0.6);
    });

    // Total
    const totalY = doc.y;
    doc.moveTo(50, totalY - 5).lineTo(500, totalY - 5).stroke();
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Total Amount:', 50, doc.y);
    doc.text(`₹${invoice.total.toFixed(2)}`, 380, doc.y - 15);

    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text('Thank you for your purchase!', { align: 'center' });

    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
