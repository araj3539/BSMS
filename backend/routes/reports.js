const express = require('express');
const Order = require('../models/Order');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Sales by day (last N days)
router.get('/sales-by-day', auth, isAdmin, async (req,res)=>{
  const days = Number(req.query.days||30);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const agg = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      total: { $sum: "$totalAmount" },
      orders: { $sum: 1 }
    }},
    { $sort: { "_id": 1 } }
  ]);
  res.json(agg);
});

module.exports = router;
