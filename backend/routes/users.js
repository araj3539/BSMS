const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const { requireAdmin } = require('../middleware/security');
const { auth } = require('../middleware/auth'); // FIXED: Added auth import

// 1. GET ALL USERS (Admin Only)
// FIXED: Added 'auth' middleware before 'requireAdmin'
router.get('/', auth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 2. UPDATE USER ROLE (Admin Only) -- NEW ROUTE
router.put('/:id/role', auth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body; // Expecting 'admin' or 'user' (or 'customer')

        // Simple Validation
        if (!['admin', 'user', 'customer'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role specified' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent Admin from changing their own role (Safety Check)
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'You cannot change your own role.' });
        }

        user.role = role;
        await user.save();

        res.json({ msg: `User role updated to ${role}`, user: { id: user._id, role: user.role } });
    } catch (err) {
        console.error("Role update error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 3. DELETE USER (Admin Only)
// FIXED: Added 'auth' middleware before 'requireAdmin'
router.delete('/:id', auth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent Admin from deleting themselves
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