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

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      doc.pipe(res);

      // Header with company info and logo area
      doc.fillColor('#2c3e50')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('SHREE MOBILES', 50, 50);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text('Professional Billing & Stock Management', 50, 85)
         .text('Address: kongu eng.. college, Erode, Tamil Nadu', 50, 100)
         .text('Phone: +91 1234567890 | Email: info@shreemobiles.com', 50, 115);

      // Invoice title and number (right side)
      doc.fillColor('#e74c3c')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('INVOICE', 400, 50, { align: 'right' });

      doc.fillColor('#2c3e50')
         .fontSize(10)
         .font('Helvetica')
         .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 85, { align: 'right' });

      const invoiceDate = new Date(invoice.createdAt);
      const dateStr = invoiceDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = invoiceDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      doc.text(`Date: ${dateStr}`, 400, 100, { align: 'right' })
         .text(`Time: ${timeStr}`, 400, 115, { align: 'right' });

      // Horizontal line
      doc.strokeColor('#bdc3c7')
         .lineWidth(2)
         .moveTo(50, 145)
         .lineTo(545, 145)
         .stroke();

      // Customer Information Box
      doc.fillColor('#34495e')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, 165);

      doc.roundedRect(50, 180, 240, 80, 5)
         .stroke();

      doc.fillColor('#2c3e50')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(invoice.customerName || 'N/A', 60, 195);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text(`Email: ${invoice.customerEmail || 'N/A'}`, 60, 215)
         .text(`Customer ID: ${invoice.userId.toString().substr(-8).toUpperCase()}`, 60, 230);

      // Payment Info Box
      doc.fillColor('#34495e')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('PAYMENT INFO:', 320, 165);

      doc.roundedRect(320, 180, 225, 80, 5)
         .stroke();

      doc.fillColor('#2c3e50')
         .fontSize(10)
         .font('Helvetica')
         .text('Payment Method: Cash/Online', 330, 195)
         .text(`Status: ${invoice.status || 'Completed'}`, 330, 215)
         .fillColor('#27ae60')
         .font('Helvetica-Bold')
         .text('PAID', 330, 235);

      // Items Table Header
      const tableTop = 290;
      doc.fillColor('#34495e')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('ITEMS PURCHASED:', 50, tableTop);

      // Table background
      const tableHeaderY = tableTop + 25;
      doc.rect(50, tableHeaderY, 495, 25)
         .fillAndStroke('#ecf0f1', '#bdc3c7');

      // Table Headers
      doc.fillColor('#2c3e50')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Product ID', 55, tableHeaderY + 8)
         .text('Product Name', 130, tableHeaderY + 8)
         .text('Qty', 310, tableHeaderY + 8)
         .text('Unit Price', 350, tableHeaderY + 8)
         .text('Discount', 420, tableHeaderY + 8)
         .text('Total', 490, tableHeaderY + 8, { align: 'right', width: 50 });

      // Items
      let currentY = tableHeaderY + 35;
      let subtotalOriginal = 0;
      let subtotalDiscounted = 0;

      invoice.items.forEach((item, index) => {
         const productId = item.productId?.productId || 'N/A';
         const originalPrice = item.originalPrice || item.price;
         const finalPrice = item.price;
         const itemOriginalTotal = originalPrice * item.quantity;
         const itemFinalTotal = finalPrice * item.quantity;
         const itemDiscount = itemOriginalTotal - itemFinalTotal;

         subtotalOriginal += itemOriginalTotal;
         subtotalDiscounted += itemFinalTotal;

         // Alternating row colors
         if (index % 2 === 0) {
            doc.rect(50, currentY - 5, 495, 30)
               .fillAndStroke('#f8f9fa', '#ecf0f1');
         }

         doc.fillColor('#2c3e50')
            .fontSize(9)
            .font('Helvetica')
            .text(productId, 55, currentY, { width: 70, ellipsis: true })
            .text(item.name || 'Product', 130, currentY, { width: 175, ellipsis: true })
            .text(String(item.quantity), 310, currentY)
            .text(`Rs.${finalPrice.toFixed(2)}`, 340, currentY, { width: 70 })
            .text(itemDiscount > 0 ? `-Rs.${itemDiscount.toFixed(2)}` : '-', 410, currentY, { width: 75 })
            .text(`Rs.${itemFinalTotal.toFixed(2)}`, 460, currentY, { align: 'right', width: 85 });

         currentY += 25;

         // Applied Offers (if any)
         if (Array.isArray(item.appliedOffers) && item.appliedOffers.length > 0) {
            doc.fontSize(7)
               .font('Helvetica-Oblique')
               .fillColor('#e74c3c');
            item.appliedOffers.forEach((o) => {
               const desc = `${o.name || 'Offer'} (${o.discountPercent}% OFF)`;
               doc.text(`* ${desc}`, 140, currentY);
               currentY += 10;
            });
            doc.font('Helvetica');
            currentY += 5;
         }

         // Check for page break
         if (currentY > 650) {
            doc.addPage();
            currentY = 50;
         }
      });

      // Summary Box
      const summaryTop = currentY + 20;
      doc.strokeColor('#bdc3c7')
         .lineWidth(1)
         .moveTo(320, summaryTop)
         .lineTo(545, summaryTop)
         .stroke();

      const tax = Math.round((subtotalDiscounted * 0.18 + Number.EPSILON) * 100) / 100;
      const totalAmount = Math.round((subtotalDiscounted + tax + Number.EPSILON) * 100) / 100;
      const totalSavings = subtotalOriginal - subtotalDiscounted;

      doc.fillColor('#7f8c8d')
         .fontSize(10)
         .font('Helvetica')
         .text('Subtotal (Original):', 320, summaryTop + 15)
         .text(`Rs.${subtotalOriginal.toFixed(2)}`, 450, summaryTop + 15, { align: 'right', width: 95 });

      if (totalSavings > 0) {
         doc.fillColor('#e74c3c')
            .text('Total Savings:', 320, summaryTop + 35)
            .text(`-Rs.${totalSavings.toFixed(2)}`, 450, summaryTop + 35, { align: 'right', width: 95 });

         doc.fillColor('#7f8c8d')
            .text('Subtotal (After Discount):', 320, summaryTop + 55)
            .text(`Rs.${subtotalDiscounted.toFixed(2)}`, 450, summaryTop + 55, { align: 'right', width: 95 });
      }

      const taxY = totalSavings > 0 ? summaryTop + 75 : summaryTop + 35;
      doc.text('Tax (GST 18%):', 320, taxY)
         .text(`Rs.${tax.toFixed(2)}`, 450, taxY, { align: 'right', width: 95 });

      // Total line
      const totalY = taxY + 25;
      doc.strokeColor('#2c3e50')
         .lineWidth(2)
         .moveTo(320, totalY - 5)
         .lineTo(545, totalY - 5)
         .stroke();

      doc.fillColor('#2c3e50')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT:', 320, totalY + 5)
         .text(`Rs.${totalAmount.toFixed(2)}`, 440, totalY + 5, { align: 'right', width: 105 });

      // Terms and Conditions
      const termsY = totalY + 50;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text('Terms & Conditions:', 50, termsY);

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text('1. Goods once sold cannot be returned or exchanged.', 50, termsY + 15)
         .text('2. Warranty applicable as per manufacturer terms.', 50, termsY + 28)
         .text('3. All disputes subject to local jurisdiction.', 50, termsY + 41);

      // Signature Section
      const signatureY = termsY + 70;
      doc.strokeColor('#bdc3c7')
         .lineWidth(1)
         .moveTo(50, signatureY)
         .lineTo(545, signatureY)
         .stroke();

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text('Authorized Signature:', 380, signatureY + 20);

      doc.moveTo(380, signatureY + 60)
         .lineTo(520, signatureY + 60)
         .stroke();

      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#7f8c8d')
         .text('Shree Mobiles - Authorized Signatory', 380, signatureY + 65);

      // Footer
      const footerY = 750;
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#95a5a6')
         .text('This is a computer-generated invoice and does not require a physical signature.', 50, footerY, { align: 'center', width: 495 })
         .text('For any queries, please contact us at info@shreemobiles.com or call +91 1234567890', 50, footerY + 15, { align: 'center', width: 495 });

      doc.end();
   } catch (e) {
      console.error('PDF generation error:', e);
      res.status(500).json({ error: e.message });
   }
});

module.exports = router;
