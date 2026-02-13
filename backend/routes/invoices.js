const express = require('express');
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create invoice from checkout
router.post('/checkout', verifyToken, async (req, res) => {
   try {
      const { cart, customer } = req.body;
      if (!cart || !cart.length) return res.status(400).json({ error: 'empty cart' });

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const items = [];
      for (const entry of cart) {
         const pid = entry.productId || entry._id || entry.id;
         if (!pid) return res.status(400).json({ error: 'Each cart item must include a product id' });

         const prod = await Product.findById(pid);
         if (!prod) return res.status(404).json({ error: `Product not found: ${pid}` });

         const quantity = parseInt(entry.quantity, 10) || 1;

         // Check stock availability
         if (prod.stock < quantity) {
            return res.status(400).json({ error: `Insufficient stock for ${prod.name}. Available: ${prod.stock}` });
         }

         const price = typeof entry.price === 'number' ? entry.price : prod.price || 0;
         const originalPrice = typeof entry.originalPrice === 'number' ? entry.originalPrice : prod.price || 0;
         const appliedOffers = Array.isArray(entry.appliedOffers) ? entry.appliedOffers : []

         items.push({
            productId: prod._id,
            name: prod.name,
            price,
            originalPrice,
            appliedOffers,
            quantity
         });

         // Reduce stock
         await Product.findByIdAndUpdate(pid, { $inc: { stock: -quantity } });
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
      console.error('Checkout error:', e);
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

// Get ALL invoices (Admin only)
router.get('/all', verifyToken, async (req, res) => {
   try {
      const user = await User.findById(req.userId);
      if (!user || user.role !== 'admin') {
         return res.status(403).json({ error: 'Access denied. Admin only.' });
      }
      const invoices = await Invoice.find().populate('items.productId').sort({ createdAt: -1 });
      res.json({ invoices });
   } catch (e) {
      res.status(500).json({ error: e.message });
   }
});

// Get single invoice
router.get('/:id', verifyToken, async (req, res) => {
   try {
      const user = await User.findById(req.userId);
      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      // Allow if owner OR admin
      if (invoice.userId.toString() !== req.userId && user.role !== 'admin') {
         return res.status(403).json({ error: 'Access denied' });
      }
      res.json({ invoice });
   } catch (e) {
      res.status(500).json({ error: e.message });
   }
});

// Generate and download invoice as PDF
router.get('/:id/pdf', verifyToken, async (req, res) => {
   try {
      const user = await User.findById(req.userId);
      const invoice = await Invoice.findById(req.params.id).populate('items.productId');

      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      // Allow if owner OR admin
      if (invoice.userId.toString() !== req.userId && user.role !== 'admin') {
         return res.status(403).json({ error: 'Access denied' });
      }

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      doc.pipe(res);

      // --- COLORS & FONTS ---
      const BRAND_BLUE = '#2563eb';      // Blue for Logo/Total
      const TEXT_DARK = '#1f2937';       // Main text
      const TEXT_LIGHT = '#9ca3af';      // Labels (lighter gray)
      const TEXT_GRAY = '#6b7280';       // Secondary text
      const ACCENT_ORANGE = '#d97706';   // Status color
      const BORDER_COLOR = '#e5e7eb';    // Light border

      // --- HEADER SECTION ---
      // Logo: "SM" in Blue Box
      doc.roundedRect(40, 40, 30, 30, 6).fill(BRAND_BLUE);
      doc.fillColor('white').fontSize(14).font('Helvetica-Bold').text('SM', 40, 48, { width: 30, align: 'center' });

      // Company Name
      doc.fillColor(TEXT_DARK).fontSize(16).font('Helvetica-Bold').text('SHREE MOBILES', 80, 48);

      // Company Address (Below Logo)
      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
         .text('123 Tech Plaza, MG Road', 40, 85)
         .text('Mumbai, Maharashtra 400001', 40, 98)
         .text('GSTIN: 27AAAAA0000A1Z5', 40, 111)
         .text('Email: billing@shreemobiles.in', 40, 124);

      // Invoice Total (Top Right)
      const totalAmountVal = `Rs.${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica-Bold').text('INVOICE TOTAL', 400, 48, { align: 'right' });
      doc.fillColor(TEXT_DARK).fontSize(20).font('Helvetica-Bold').text(totalAmountVal, 400, 65, { align: 'right' });

      // --- INFO SECTION (TO & PAYMENT) ---
      const infoY = 180;

      // "TO" Column
      doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica-Bold').text('TO', 40, infoY);

      const customerName = invoice.customerName || 'Customer';
      doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text(customerName, 40, infoY + 20);

      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
         .text('456 Skyline Apartments, Worli', 40, infoY + 38)
         .text('Mumbai, Maharashtra 400018', 40, infoY + 51)
         .text(`Phone: ${invoice.customerPhone || '+91 98765 43210'}`, 40, infoY + 64)
         .text('GSTIN: 27BBBBB1111B1Z2', 40, infoY + 77);

      // "PAYMENT METHOD" Column (Right Side)
      const col2X = 350;
      doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica-Bold').text('PAYMENT METHOD', col2X, infoY);

      doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text('Online / UPI', col2X, infoY + 20);

      // Status
      const status = (invoice.status || 'PAID').toUpperCase();
      const statusColor = status === 'PAID' || status === 'COMPLETED' ? ACCENT_ORANGE : TEXT_DARK;
      doc.fillColor(statusColor).fontSize(10).font('Helvetica-Bold').text('COMPLETED', col2X, infoY + 40);

      // Transaction Details
      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
         .text(`Transaction ID: TXN-${invoice._id.toString().slice(-8).toUpperCase()}`, col2X, infoY + 58)
         .text(`Paid on: ${new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, col2X, infoY + 71);

      // --- ITEMS TABLE ---
      const tableTop = 320;

      // Headers
      doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica-Bold');
      doc.text('DESCRIPTION', 40, tableTop);
      doc.text('QTY', 300, tableTop, { align: 'center', width: 40 });
      doc.text('UNIT PRICE', 380, tableTop, { align: 'right', width: 80 });
      doc.text('TOTAL', 500, tableTop, { align: 'right', width: 55 });

      // Header Line
      doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();

      let currentY = tableTop + 30;
      let subtotal = 0;

      invoice.items.forEach(item => {
         const itemTotal = item.price * item.quantity;
         subtotal += (itemTotal / 1.18); // rough consistency check

         doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica-Bold').text(item.name, 40, currentY);
         doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica').text('256GB, Blue Titanium - Includes 1 Year Warranty', 40, currentY + 14);

         doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica')
            .text(item.quantity, 300, currentY + 5, { align: 'center', width: 40 });

         doc.text(`Rs.${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 380, currentY + 5, { align: 'right', width: 80 });

         doc.font('Helvetica-Bold')
            .text(`Rs.${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 500, currentY + 5, { align: 'right', width: 55 });

         currentY += 50;

         // Row separator
         doc.moveTo(40, currentY - 10).lineTo(555, currentY - 10).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
      });

      // --- SUMMARY & FOOTER ---
      const footerY = currentY + 30;

      // Notes (Left)
      doc.fillColor(TEXT_LIGHT).fontSize(9).font('Helvetica-Bold').text('NOTES & TERMS', 40, footerY);
      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
         .text('Please pay the invoice within 15 days. Make all checks payable to', 40, footerY + 15)
         .text('Shree Mobiles. Thank you for your business!', 40, footerY + 28);

      // Totals (Right)
      const sumXLabel = 320;
      const sumXValue = 435;
      const sumValWidth = 120; // Increased width to prevent wrapping
      const sumLineHeight = 20;
      let sumY = footerY;

      // Calculate exacts for display
      // Assuming invoice.total is the final grand total
      // We'll reverse calc GST for display if we want to match the "math" exactly or just use stored values if they existed.
      // For now, reverse calc:
      const totalVal = invoice.total;
      const subtotalVal = totalVal / 1.18;
      const gstVal = totalVal - subtotalVal;
      const discountVal = 0;

      doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica');

      // Subtotal
      doc.text('Subtotal', sumXLabel, sumY);
      doc.text(`Rs.${subtotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, sumXValue, sumY, { align: 'right', width: sumValWidth });
      sumY += sumLineHeight;

      // GST
      doc.text('GST (18%)', sumXLabel, sumY);
      doc.text(`Rs.${gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, sumXValue, sumY, { align: 'right', width: sumValWidth });
      sumY += sumLineHeight;

      // Discount
      doc.fillColor('#10b981').text('Discount (0%)', sumXLabel, sumY);
      doc.text(`-Rs.0.00`, sumXValue, sumY, { align: 'right', width: sumValWidth });
      sumY += sumLineHeight + 10;

      // GRAND TOTAL
      doc.fillColor(TEXT_DARK).fontSize(11).font('Helvetica-Bold').text('GRAND TOTAL', sumXLabel, sumY);
      doc.fillColor(BRAND_BLUE).fontSize(16).text(`Rs.${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, sumXValue, sumY - 4, { align: 'right', width: sumValWidth });

      // Authorized Signatory
      const signY = sumY + 60;
      doc.moveTo(sumXValue, signY).lineTo(sumXValue + sumValWidth, signY).strokeColor(BORDER_COLOR).stroke();
      doc.fillColor(TEXT_LIGHT).fontSize(8).font('Helvetica-Bold').text('AUTHORIZED SIGNATORY', sumXValue, signY + 5, { align: 'center', width: sumValWidth });

      doc.end();
   } catch (e) {
      console.error('PDF generation error:', e);
      res.status(500).json({ error: e.message });
   }
});

module.exports = router;
