const express = require('express');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const { auth } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { requireAdmin } = require('../middleware/security'); // Added
const router = express.Router();

// Admin dashboard summary
router.get('/dashboard', auth, requireAdmin, async (req,res)=>{
  const totalSalesAgg = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, orders: { $sum: 1 } } }
  ]);
  const lowStock = await Book.find({ stock: { $lte: 5 } }).limit(50);
  const bestSellers = await Book.find().sort({ soldCount: -1 }).limit(10);
  res.json({
    totalSales: totalSalesAgg[0]?.totalSales || 0,
    totalOrders: totalSalesAgg[0]?.orders || 0,
    lowStock,
    bestSellers
  });
});

router.get('/audit-logs', auth, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100) // Show last 100 actions
      .populate('userId', 'name email'); // Show who did it
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Recommendations endpoint (simple)
router.get('/recommendations/:bookId?', async (req,res)=>{
  // if bookId given, recommend same category + best sellers
  const { bookId } = req.params;
  if(bookId) {
    const book = await Book.findById(bookId);
    if(!book) return res.json([]);
    const recs = await Book.find({ category: book.category, _id: { $ne: book._id } }).sort({ soldCount:-1 }).limit(8);
    return res.json(recs);
  }else{
    // general best-sellers & new arrivals
    const best = await Book.find().sort({ soldCount:-1 }).limit(8);
    const newArrivals = await Book.find().sort({ createdAt:-1 }).limit(8);
    return res.json({ best, newArrivals });
  }
});

module.exports = router;