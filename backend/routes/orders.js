// backend/routes/orders.js
const express = require('express');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { sendEmail, getEmailTemplate } = require('../utils/email');
const { generateInvoiceBuffer, streamInvoice } = require('../utils/invoice');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// --- HELPER: Escape Regex ---
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

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

router.post('/checkout-init', auth, async (req, res) => {
  try {
    const { items, promotionCode, shippingAddress, saveAddress, addressLabel } = req.body;
    const userId = req.user.id;

    const bookIds = items.map(it => it.bookId);
    const books = await Book.find({ _id: { $in: bookIds } });
    
    let rawSubtotal = 0;
    const orderItems = [];
    
    for (const it of items) {
      const b = books.find(x => x._id.toString() === it.bookId);
      if (!b) return res.status(400).json({ msg: 'Book not found' });
      if (b.stock < it.qty) return res.status(400).json({ msg: `Insufficient stock: ${b.title}` });
      
      rawSubtotal += b.price * it.qty;
      orderItems.push({ bookId: b._id, title: b.title, qty: it.qty, price: b.price });
    }

    let discount = 0;
    let promoDetails = null;
    const subtotal = round(rawSubtotal);
    
    if (promotionCode) {
      const promo = await Promotion.findOne({ code: promotionCode, active: true });
      if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) && subtotal >= (promo.minOrderValue || 0)) {
        discount = promo.type === 'percent' ? round(subtotal * (promo.value / 100)) : round(promo.value);
        promoDetails = promo.code;
      }
    }
    const totalAmount = round(Math.max(0, subtotal - discount));

    const newOrder = new Order({
      userId,
      userEmail: req.user.email,
      userIdName: req.user.name,
      items: orderItems,
      subtotal,
      discount,
      totalAmount,
      promotionCode: promoDetails,
      shippingAddress,
      status: 'payment_pending'
    });
    await newOrder.save();

    if (saveAddress && shippingAddress) {
        await User.findByIdAndUpdate(userId, { 
            $addToSet: { addresses: { label: addressLabel || 'New', address: shippingAddress } } 
        });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'inr',
      metadata: { 
        orderId: newOrder._id.toString()
      }
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret, 
      orderId: newOrder._id 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error during checkout init' });
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // FIX: Use 'req.rawBody' instead of 'req.body'
    // 'req.rawBody' was created by the express.json() verify function in server.js
    event = stripe.webhooks.constructEvent(
        req.rawBody, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { orderId } = paymentIntent.metadata;

    console.log(`💰 Payment succeeded for Order ${orderId}`);

    try {
        const order = await Order.findById(orderId);
        if(order && order.status === 'payment_pending') {
            
            // 1. Update Status
            order.status = 'pending'; // Confirmed!
            order.paymentId = paymentIntent.id;
            await order.save();

            // 2. Deduct Stock
            const bulkOps = order.items.map(item => ({
                updateOne: { 
                    filter: { _id: item.bookId }, 
                    update: { $inc: { stock: -item.qty, soldCount: item.qty } } 
                }
            }));
            await Book.bulkWrite(bulkOps);

            // 3. Send Email
            try {
                const invoiceBuffer = await generateInvoiceBuffer(order);
                const html = getEmailTemplate({
                    title: `Order Confirmed!`,
                    message: "Thank you for your purchase.",
                    orderId: order._id,
                    items: order.items,
                    subtotal: order.subtotal,
                    discount: order.discount,
                    total: order.totalAmount,
                    status: 'Paid'
                });
                await sendEmail({ 
                    to: order.userEmail, 
                    subject: `Order #${order._id} Confirmed`, 
                    html,
                    attachments: [{ filename: `Invoice.pdf`, content: invoiceBuffer }]
                });
            } catch(e) { console.error("Email fail", e); }
        }
    } catch (err) {
        console.error('Error processing webhook order:', err);
    }
  }

  res.send(); // Acknowledge receipt
});

router.get('/:id/invoice', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    streamInvoice(order, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const list = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json(list);
    }

    const { q, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const lim = Math.max(1, Math.min(100, Number(limit)));
    
    const filter = {};

    if (status) filter.status = status;

    if (q) {
      const isObjectId = q.match(/^[0-9a-fA-F]{24}$/);
      
      if (isObjectId) {
        filter._id = q;
      } else {
        // SECURITY: Sanitize query
        const cleanQ = escapeRegex(q);
        const regex = new RegExp(cleanQ, 'i');
        filter.$or = [
          { userIdName: regex },
          { userEmail: regex },
          { paymentId: regex }
        ];
      }
    }

    const skip = (pageNum - 1) * lim;

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
    ]);

    res.json({ orders, total, page: pageNum, limit: lim });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
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

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ msg: 'Cannot cancel order that is already processing or shipped' });
    }

    order.status = 'cancelled';
    await order.save();

    const bulkOps = order.items.map(item => ({
      updateOne: { 
        filter: { _id: item.bookId }, 
        update: { $inc: { stock: item.qty, soldCount: -item.qty } } 
      }
    }));
    await Book.bulkWrite(bulkOps);

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