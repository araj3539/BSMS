const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Book = require("../models/Book");
const User = require("../models/User");

const { auth, isAdmin } = require("../middleware/auth");

/* ============================================================
   SALES BY DAY
   ============================================================ */

router.get("/sales-by-day", auth, isAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days || 30);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
          paidAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$paidAt",
            },
          },
          totalRevenue: {
            $sum: "$totalAmount",
          },
          totalOrders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Unable to fetch sales data.",
    });
  }
});

/* ============================================================
   SALES BY CATEGORY
   ============================================================ */

router.get("/category-sales", auth, isAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
        },
      },

      {
        $unwind: "$items",
      },

      {
        $lookup: {
          from: "books",
          localField: "items.bookId",
          foreignField: "_id",
          as: "book",
        },
      },

      {
        $unwind: "$book",
      },

      {
        $group: {
          _id: "$book.category",
          value: {
            $sum: {
              $multiply: ["$items.price", "$items.qty"],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      },

      {
        $sort: {
          value: -1,
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Unable to fetch category statistics.",
    });
  }
});

/* ============================================================
   DASHBOARD
   ============================================================ */

router.get("/dashboard", auth, isAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = new Date();
    last7Days.setHours(0, 0, 0, 0);
    last7Days.setDate(last7Days.getDate() - 6);

    const [
      totalRevenueAgg,
      todayRevenueAgg,
      weeklyRevenueRaw,
      totalOrders,
      pendingOrders,
      totalBooks,
      totalCustomers,
      recentOrders,
      lowStockBooks,
      topBooks,
    ] = await Promise.all([
      /* ============================================================
         TOTAL REVENUE
      ============================================================ */

      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),

      /* ============================================================
         TODAY'S REVENUE
      ============================================================ */

      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
            paidAt: {
              $gte: today,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),

      /* ============================================================
         WEEKLY REVENUE
      ============================================================ */

      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
            paidAt: {
              $gte: last7Days,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$paidAt",
              },
            },
            revenue: {
              $sum: "$totalAmount",
            },
            orders: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      /* ============================================================
         TOTAL ORDERS
      ============================================================ */

      Order.countDocuments(),

      /* ============================================================
         PENDING ORDERS
      ============================================================ */

      Order.countDocuments({
        status: {
          $in: ["pending", "processing"],
        },
      }),

      /* ============================================================
         TOTAL BOOKS
      ============================================================ */

      Book.countDocuments(),

      /* ============================================================
         TOTAL CUSTOMERS
      ============================================================ */

      User.countDocuments({
        role: "customer",
      }),

      /* ============================================================
         RECENT ORDERS
      ============================================================ */

      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .select("userId totalAmount status paymentStatus createdAt"),

      /* ============================================================
         LOW STOCK BOOKS
      ============================================================ */

      Book.find({
        stock: {
          $lt: 10,
        },
      })
        .sort({
          stock: 1,
        })
        .limit(10)
        .select("title author stock price category"),

      /* ============================================================
         TOP SELLING BOOKS
      ============================================================ */

      Book.find()
        .sort({
          soldCount: -1,
        })
        .limit(10)
        .select("title author soldCount stock category"),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    const weeklyRevenue = [];

    /* ============================================================
       FILL MISSING DAYS IN WEEKLY CHART
    ============================================================ */

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const dateKey = date.toISOString().split("T")[0];

      const existing = weeklyRevenueRaw.find((item) => item._id === dateKey);

      weeklyRevenue.push({
        date: dateKey,
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        revenue: existing?.revenue || 0,
        orders: existing?.orders || 0,
      });
    }

    /* ============================================================
       DASHBOARD RESPONSE
    ============================================================ */

    res.json({
      cards: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        pendingOrders,
        totalBooks,
        totalCustomers,
      },

      weeklyRevenue,

      recentOrders,

      topBooks,

      lowStockBooks,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Dashboard error",
    });
  }
});

/* ============================================================
   EXPORT ROUTER
   ============================================================ */

module.exports = router;
