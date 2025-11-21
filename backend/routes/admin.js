const express = require('express');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Admin dashboard summary
router.get('/dashboard', auth, isAdmin, async (req,res)=>{
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
