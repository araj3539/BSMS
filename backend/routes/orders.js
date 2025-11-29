const express = require('express');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { sendEmail, getEmailTemplate } = require('../utils/email');
// --- IMPORT NEW UTILS ---
const { generateInvoiceBuffer, streamInvoice } = require('../utils/invoice');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// ... (validateOrder code remains the same) ...
const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.bookId').notEmpty().withMessage('Invalid item data'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('shippingAddress').notEmpty().withMessage('Shipping Address is required'), 
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0].msg });
    next();
  }
];

// --- NEW ROUTE: Download Invoice ---
router.get('/:id/invoice', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    
    // Check permissions (owner or admin)
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    streamInvoice(order, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST / - Place Order (Updated)
router.post('/', auth, validateOrder, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, name } = req.user;
    const { items, promotionCode, paymentId, shippingAddress, saveAddress, addressLabel } = req.body; 

    // ... (Existing logic: Fetch books, calculate subtotal/discount/total) ...
    const bookIds = items.map(it => it.bookId);
    const books = await Book.find({ _id: { $in: bookIds } });

    let rawSubtotal = 0;
    const orderItems = [];
    for (const it of items) {
      const b = books.find(x => x._id.toString() === it.bookId);
      if (!b) return res.status(400).json({ msg: 'Book not found' });
      if (it.qty > b.stock) return res.status(400).json({ msg: `Insufficient stock for ${b.title}` });
      
      const itemTotal = b.price * it.qty;
      rawSubtotal += itemTotal;
      
      orderItems.push({ bookId: b._id, title: b.title, qty: it.qty, price: b.price });
    }

    let discount = 0;
    const subtotal = round(rawSubtotal);
    let promo = null;

    if (promotionCode) {
      promo = await Promotion.findOne({ code: promotionCode, active: true });
      if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) && subtotal >= (promo.minOrderValue || 0)) {
        if (promo.type === 'percent') discount = round(subtotal * (promo.value / 100));
        else discount = round(promo.value);
      }
    }
    const totalAmount = round(Math.max(0, subtotal - discount));

    // ... (Existing Stripe & Stock Logic) ...
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      if (paymentIntent.status !== 'succeeded') return res.status(400).json({ msg: 'Payment verification failed' });
    } catch (stripeErr) { return res.status(400).json({ msg: 'Payment verification failed' }); }

    const bulkOps = books.map(b => {
      const qty = items.find(it => it.bookId === b._id.toString()).qty;
      return { updateOne: { filter: { _id: b._id }, update: { $inc: { stock: -qty, soldCount: qty } } } };
    });
    await Book.bulkWrite(bulkOps);

    if (saveAddress && shippingAddress) {
      const user = await User.findById(userId);
      if(user && !user.addresses.some(a => a.address.trim() === shippingAddress.trim())) {
          user.addresses.push({ label: addressLabel || 'Checkout Address', address: shippingAddress });
          await user.save();
      }
    }

    const order = new Order({
      userId, userEmail: email, userIdName: name, items: orderItems,
      subtotal, discount, totalAmount, promotionCode: promo ? promo.code : null,
      paymentId, shippingAddress
    });
    await order.save();

    // --- UPDATED: Generate Invoice & Attach to Email ---
    try {
      // 1. Generate PDF Buffer
      const invoiceBuffer = await generateInvoiceBuffer(order);

      // 2. Get HTML Content
      const html = getEmailTemplate({
        title: `Thank you for your order, ${name}!`,
        message: "We have received your order. Please find your invoice attached below.",
        orderId: order._id,
        items: orderItems,
        subtotal: Number(subtotal),
        discount: Number(discount),
        total: Number(totalAmount),
        status: 'Pending'
      });

      // 3. Send Email with Attachment
      await sendEmail({ 
        to: email, 
        subject: `Order Confirmation #${order._id}`, 
        html,
        attachments: [
          {
            filename: `Invoice-${order._id}.pdf`,
            content: invoiceBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
    } catch (emailErr) { console.error('Failed to send email/invoice:', emailErr); }
    
    res.json({ order });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'err', err: err.message });
  }
});

// ... (Existing GET / and GET /:id routes) ...
router.get('/', auth, async (req,res)=>{
  if(req.user.role === 'admin') {
    const all = await Order.find().sort({ createdAt: -1 }).limit(200);
    return res.json(all);
  }
  const list = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(list);
});

router.get('/:id', auth, async (req, res) => {
  try {
    const o = await Order.findById(req.params.id).lean();
    if (!o) return res.status(404).json({ msg: 'Not found' });
    if (req.user.role !== 'admin' && o.userId.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });
    res.json(o);
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
});

router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','processing','shipped','delivered','cancelled'];
    if(!allowed.includes(status)) return res.status(400).json({ msg: 'Invalid status' });
    
    const o = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if(!o) return res.status(404).json({ msg: 'Not found' });

    if (['shipped', 'delivered', 'cancelled'].includes(status)) {
      const messages = {
        shipped: 'Great news! Your order has been shipped.',
        delivered: 'Your order has been delivered.',
        cancelled: 'Your order has been cancelled.'
      };
      const html = getEmailTemplate({
        title: `Order Update: ${status.toUpperCase()}`,
        message: messages[status],
        orderId: o._id,
        items: o.items,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        total: Number(o.totalAmount),
        status: status
      });
      await sendEmail({ to: o.userEmail, subject: `Order #${o._id} is ${status}`, html });
    }
    res.json(o);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { items, promotionCode } = req.body;
    const bookIds = items.map(it => it.bookId);
    const books = await Book.find({ _id: { $in: bookIds } });

    let subtotal = 0;
    for (const it of items) {
      const b = books.find(x => x._id.toString() === it.bookId);
      if (!b) return res.status(400).json({ msg: 'Book not found' });
      subtotal += b.price * it.qty;
    }

    let discount = 0;
    if (promotionCode) {
      const promo = await Promotion.findOne({ code: promotionCode, active: true });
      if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) && subtotal >= (promo.minOrderValue || 0)) {
        if (promo.type === 'percent') discount = round(subtotal * (promo.value / 100));
        else discount = round(promo.value);
      }
    }
    const totalAmount = round(Math.max(0, subtotal - discount));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), 
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Payment initialization failed' });
  }
});

// USER: Cancel Order
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // 1. Ownership Check
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // 2. Status Check
    if (order.status !== 'pending') {
      return res.status(400).json({ msg: 'Cannot cancel order that is already processing or shipped' });
    }

    // 3. Update Status
    order.status = 'cancelled';
    await order.save();

    // 4. Restock Inventory (Important!)
    const bulkOps = order.items.map(item => ({
      updateOne: { 
        filter: { _id: item.bookId }, 
        update: { $inc: { stock: item.qty, soldCount: -item.qty } } 
      }
    }));
    await Book.bulkWrite(bulkOps);

    // 5. Send Email
    const html = getEmailTemplate({
        title: 'Order Cancelled',
        message: 'Your order has been successfully cancelled as per your request.',
        orderId: order._id,
        items: order.items,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        total: Number(order.totalAmount),
        status: 'cancelled'
    });
    await sendEmail({ to: order.userEmail, subject: `Order #${order._id} Cancelled`, html });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;