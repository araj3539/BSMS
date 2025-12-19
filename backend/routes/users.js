const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/security'); 
// 1. IMPORT THE AUTH MIDDLEWARE
const { auth } = require('../middleware/auth'); 

// 2. ADD 'auth' BEFORE 'requireAdmin'
router.get('/', auth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 3. ADD 'auth' HERE TOO
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot delete yourself!' });
        }

        await user.deleteOne();
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;