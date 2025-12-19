const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model
const { requireAdmin } = require('../middleware/security'); // Use the admin check we fixed earlier

// 1. GET ALL USERS (Admin Only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        // .select('-password') excludes the password field from the result
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// 2. DELETE USER (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
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