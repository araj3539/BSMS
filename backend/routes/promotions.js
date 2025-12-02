// backend/routes/promotions.js
const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { auth } = require('../middleware/auth'); 
const { requireAdmin, audit } = require('../middleware/security'); // Import Security Middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// List promotions 
// (Admins see ALL to manage them, Customers see only ACTIVE)
router.get('/', async (req, res) => {
  try {
    let isAdmin = false;

    // Manual token check because this route is public-facing but has an admin mode
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin') isAdmin = true;
      } catch (e) {
        // Token invalid/expired - treat as guest
      }
    }

    if (isAdmin) {
      const all = await Promotion.find().sort({ createdAt: -1 });
      return res.json(all);
    }

    // Default: Show only active for customers
    const active = await Promotion.find({ active: true }).sort({ createdAt: -1 });
    res.json(active);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin create promotion (Secured & Audited)
router.post('/', 
  auth, 
  requireAdmin, 
  audit('CREATE_PROMOTION'), // Audit Log
  async (req, res) => {
    try {
      const p = new Promotion(req.body);
      p.code = (p.code || p.name).toString().toUpperCase();
      await p.save();
      res.status(201).json(p);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Admin update (Secured & Audited)
router.put('/:id', 
  auth, 
  requireAdmin, 
  audit('UPDATE_PROMOTION'), // Audit Log
  async (req, res) => {
    try {
      if (req.body.code) req.body.code = req.body.code.toUpperCase();
      const updated = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Admin delete (Secured & Audited)
router.delete('/:id', 
  auth, 
  requireAdmin, 
  audit('DELETE_PROMOTION'), // Audit Log
  async (req, res) => {
    try {
      await Promotion.findByIdAndDelete(req.params.id);
      res.json({ msg: 'Deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Validate a code & return discount amount for given subtotal (Public)
// GET /api/promotions/validate?code=FOO&subtotal=1000
router.get('/validate', async (req, res) => {
  try {
    const code = (req.query.code || '').toString().toUpperCase();
    const subtotal = Number(req.query.subtotal || 0);
    if (!code) return res.status(400).json({ msg: 'Code required' });

    const promo = await Promotion.findOne({ code, active: true });
    if (!promo) return res.status(404).json({ msg: 'Invalid or inactive code' });

    if (promo.expiresAt && promo.expiresAt <= new Date()) {
      return res.status(400).json({ msg: 'Promotion expired' });
    }
    if (subtotal < (promo.minOrderValue || 0)) {
      return res.status(400).json({ msg: `Requires min order value ₹${promo.minOrderValue}` });
    }

    let discount = 0;
    if (promo.type === 'percent') discount = subtotal * (promo.value / 100);
    else discount = promo.value;

    const total = Math.max(0, subtotal - discount);
    res.json({ promo, discount, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;