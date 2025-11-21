// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const crypto = require('crypto'); 

// Import the shared Email Utility
const { sendEmail } = require('../utils/email'); 

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';
const TOKEN_EXPIRES = '7d';

// --- HELPER: Sanitize User Object ---
function getSafeUser(user) {
  const u = user.toObject();
  delete u.password;
  delete u.resetPasswordToken;
  delete u.resetPasswordExpires;
  return u;
}

// --- AUTH ROUTES ---

// POST /api/auth/signup
router.post('/signup',
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      let existing = await User.findOne({ email });
      if(existing) return res.status(400).json({ msg: 'Email already registered' });

      const user = new User({ name, email, password, role: 'customer' });
      await user.save();

      const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
      
      res.json({ token, user: getSafeUser(user) });
    } catch(err){
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if(!user) return res.status(400).json({ msg: 'Invalid credentials' });

      const ok = await user.comparePassword(password);
      if(!ok) return res.status(400).json({ msg: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
      
      res.json({ token, user: getSafeUser(user) });
    } catch(err){
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// PUT /api/auth/profile
router.put('/profile',
  auth,
  body('name').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });

      user.name = name;
      await user.save();
      
      const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
      
      res.json({ token, user: getSafeUser(user) });
    } catch(err){
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// --- FORGOT PASSWORD ROUTES ---

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    
    // Use the shared helper function
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click this link to reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({ msg: 'Email sent! Check server console for preview link.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- WISHLIST ROUTES ---

router.get('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json(user.wishlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/wishlist/:id', auth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const user = await User.findById(req.user.id);

    const index = user.wishlist.indexOf(bookId);
    if (index === -1) user.wishlist.push(bookId);
    else user.wishlist.splice(index, 1);

    await user.save();
    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- ADDRESS ROUTES ---

router.post('/address', auth, async (req, res) => {
  try {
    const { label, address } = req.body;
    if(!label || !address) return res.status(400).json({ msg: 'Label and address required' });

    const user = await User.findById(req.user.id);
    user.addresses.push({ label, address });
    await user.save();

    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/address/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();

    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// --- GET ME (SESSION REFRESH) ---

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;