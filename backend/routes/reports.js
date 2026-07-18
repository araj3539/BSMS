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

router.get("/monthly-revenue", auth, isAdmin, async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const monthlyRevenueRaw = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
          paidAt: {
            $gte: start,
            $lt: end,
          },
        },
      },
      {
        $group: {
          _id: {
            $month: "$paidAt",
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
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyRevenue = [];

    for (let i = 1; i <= 12; i++) {
      const existing = monthlyRevenueRaw.find((m) => m._id === i);

      monthlyRevenue.push({
        month: months[i - 1],
        revenue: existing?.revenue || 0,
        orders: existing?.orders || 0,
      });
    }

    res.json(monthlyRevenue);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Monthly revenue error",
    });
  }
});

router.get("/order-status", auth, isAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $project: {
          analyticsStatus: {
            $cond: [
              { $eq: ["$paymentStatus", "refunded"] },
              "refunded",
              "$status",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$analyticsStatus",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const statuses = [
      "payment_pending",
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    const labels = {
      payment_pending: "Payment Pending",
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };

    const formatted = statuses.map((status) => {
      const existing = stats.find((s) => s._id === status);

      return {
        key: status,
        name: labels[status],
        count: existing?.count || 0,
      };
    });

    const summary = {
      totalOrders: formatted.reduce((sum, item) => sum + item.count, 0),

      paymentPendingOrders:
        formatted.find((x) => x.key === "payment_pending")?.count || 0,

      pendingOrders: formatted.find((x) => x.key === "pending")?.count || 0,

      processingOrders:
        formatted.find((x) => x.key === "processing")?.count || 0,

      shippedOrders: formatted.find((x) => x.key === "shipped")?.count || 0,

      deliveredOrders: formatted.find((x) => x.key === "delivered")?.count || 0,

      cancelledOrders: formatted.find((x) => x.key === "cancelled")?.count || 0,

      refundedOrders: formatted.find((x) => x.key === "refunded")?.count || 0,
    };

    summary.activeOrders =
      summary.pendingOrders + summary.processingOrders + summary.shippedOrders;

    summary.completionRate =
      summary.totalOrders === 0
        ? 0
        : Number(
            ((summary.deliveredOrders / summary.totalOrders) * 100).toFixed(2),
          );

    summary.cancellationRate =
      summary.totalOrders === 0
        ? 0
        : Number(
            ((summary.cancelledOrders / summary.totalOrders) * 100).toFixed(2),
          );

    summary.refundRate =
      summary.totalOrders === 0
        ? 0
        : Number(
            ((summary.refundedOrders / summary.totalOrders) * 100).toFixed(2),
          );

    res.json({
      summary,
      distribution: formatted,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Order status analytics error",
    });
  }
});

router.get("/top-customers", auth, isAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const customers = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
        },
      },

      {
        $group: {
          _id: "$userId",

          totalSpent: {
            $sum: "$totalAmount",
          },

          totalOrders: {
            $sum: 1,
          },

          averageOrderValue: {
            $avg: "$totalAmount",
          },

          lastPurchase: {
            $max: "$paidAt",
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },

      {
        $unwind: "$customer",
      },

      {
        $project: {
          _id: 0,

          customerId: "$customer._id",

          name: "$customer.name",

          email: "$customer.email",

          totalSpent: {
            $round: ["$totalSpent", 2],
          },

          totalOrders: 1,

          averageOrderValue: {
            $round: ["$averageOrderValue", 2],
          },

          lastPurchase: 1,
        },
      },

      {
        $sort: {
          totalSpent: -1,
        },
      },

      {
        $limit: limit,
      },
    ]);

    const summary = {
      totalCustomers: await User.countDocuments({
        role: "customer",
      }),

      activeCustomers: customers.length,

      highestSpender: customers[0] || null,
    };

    res.json({
      summary,
      customers,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Top customers analytics error",
    });
  }
});

router.get("/inventory", auth, isAdmin, async (req, res) => {
  try {
    const LOW_STOCK_LIMIT = Number(req.query.lowStock || 10);
    const OVERSTOCK_LIMIT = Number(req.query.overStock || 100);

    const [
      totalBooks,
      totalStockUnits,
      inventoryValue,
      lowStockBooks,
      outOfStockBooks,
      overStockBooks,
      fastMovingBooks,
      slowMovingBooks,
    ] = await Promise.all([
      // Total Books
      Book.countDocuments(),

      // Total Stock Units
      Book.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$stock",
            },
          },
        },
      ]),

      // Total Inventory Value
      Book.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: ["$stock", "$price"],
              },
            },
          },
        },
      ]),

      // Low Stock
      Book.find({
        stock: {
          $gt: 0,
          $lt: LOW_STOCK_LIMIT,
        },
      })
        .sort({
          stock: 1,
        })
        .select("title author stock price category soldCount"),

      // Out of Stock
      Book.find({
        stock: 0,
      })
        .sort({
          soldCount: -1,
        })
        .select("title author stock category soldCount"),

      // Overstock
      Book.find({
        stock: {
          $gte: OVERSTOCK_LIMIT,
        },
      })
        .sort({
          stock: -1,
        })
        .select("title author stock category soldCount"),

      // Fast Moving
      Book.find()
        .sort({
          soldCount: -1,
        })
        .limit(10)
        .select("title author soldCount stock price category"),

      // Slow Moving
      Book.find()
        .sort({
          soldCount: 1,
        })
        .limit(10)
        .select("title author soldCount stock price category"),
    ]);

    const summary = {
      totalBooks,

      totalStockUnits: totalStockUnits[0]?.total || 0,

      inventoryValue: inventoryValue[0]?.total || 0,

      lowStockCount: lowStockBooks.length,

      outOfStockCount: outOfStockBooks.length,

      overStockCount: overStockBooks.length,
    };

    res.json({
      summary,
      lowStockBooks,
      outOfStockBooks,
      overStockBooks,
      fastMovingBooks,
      slowMovingBooks,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Inventory analytics error",
    });
  }
});

router.get("/restock-recommendations", auth, isAdmin, async (req, res) => {
  try {
    const books = await Book.find().select(
      "title author category stock soldCount price",
    );

    const recommendations = books
      .map((book) => {
        const score = book.soldCount * 2 - book.stock;

        let priority = "Low";

        if (score >= 150) priority = "Critical";
        else if (score >= 75) priority = "High";
        else if (score >= 30) priority = "Medium";

        const recommendedStock = Math.max(20, Math.ceil(book.soldCount * 0.25));

        return {
          bookId: book._id,

          title: book.title,

          author: book.author,

          category: book.category,

          currentStock: book.stock,

          soldCount: book.soldCount,

          priority,

          score,

          recommendedStock,

          stockToOrder: Math.max(0, recommendedStock - book.stock),
        };
      })
      .filter((book) => book.priority !== "Low" || book.currentStock < 10)
      .sort((a, b) => b.score - a.score);

    res.json({
      generatedAt: new Date(),

      totalRecommendations: recommendations.length,

      recommendations,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Restock recommendation error",
    });
  }
});

// =======================================================
// Inventory Health Report
// GET /api/reports/inventory-health?days=90
// =======================================================

router.get("/inventory-health", async (req, res) => {
  try {
    const deadDays = Number(req.query.days) || 90;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - deadDays);

    // ---------------------------------------------------
    // Aggregate sales from paid orders
    // ---------------------------------------------------

    const sales = await Order.aggregate([
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
        $group: {
          _id: "$items.bookId",

          totalSold: {
            $sum: "$items.qty",
          },

          lastSoldAt: {
            $max: "$paidAt",
          },
        },
      },
    ]);

    // ---------------------------------------------------
    // Create Sales Map
    // ---------------------------------------------------

    const salesMap = new Map();

    sales.forEach((sale) => {
      salesMap.set(sale._id.toString(), sale);
    });

    // ---------------------------------------------------
    // Load Books
    // ---------------------------------------------------

    const books = await Book.find().lean();

    // ---------------------------------------------------
    // Summary
    // ---------------------------------------------------

    const summary = {
      healthy: 0,
      slowMoving: 0,
      stagnant: 0,
      deadStock: 0,
      neverSold: 0,

      critical: 0,
      high: 0,
      medium: 0,
      low: 0,

      inventoryValue: 0,
    };

    // ---------------------------------------------------
    // Inventory Health
    // ---------------------------------------------------

    const inventory = books
      .map((book) => {
        const sale = salesMap.get(book._id.toString());

        const totalSold = sale?.totalSold || 0;

        const lastSoldAt = sale?.lastSoldAt || null;

        const inventoryValue = (book.stock || 0) * (book.price || 0);

        summary.inventoryValue += inventoryValue;

        const daysSinceLastSale = lastSoldAt
          ? Math.floor(
              (Date.now() - new Date(lastSoldAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;

        const isDead = !lastSoldAt || new Date(lastSoldAt) < cutoffDate;

        if (!isDead) {
          summary.healthy++;

          return {
            bookId: book._id,
            title: book.title,
            author: book.author,
            category: book.category,
            price: book.price,
            stock: book.stock,
            totalSold,
            lastSoldAt,
            daysSinceLastSale,
            inventoryValue,
            status: "Healthy",
            priority: "Low",
            recommendedAction: "None",
            reason: "Book is selling normally.",
          };
        }

        let action = "";
        let priority = "";
        let status = "";
        let reason = "";

        //--------------------------------------------------
        // Never Sold
        //--------------------------------------------------

        if (!lastSoldAt) {
          status = "Never Sold";

          if (book.stock >= 100) {
            action = "Remove";
            priority = "Critical";
          } else if (book.stock >= 50) {
            action = "Heavy Promotion";
            priority = "High";
          } else {
            action = "Monitor";
            priority = "Medium";
          }

          reason = "Book has never been sold.";

          summary.neverSold++;
        }

        //--------------------------------------------------
        // Dead Stock
        //--------------------------------------------------
        else if (daysSinceLastSale >= 365) {
          status = "Dead Stock";
          action = "Heavy Discount";
          priority = "Critical";

          reason = `No sales in ${daysSinceLastSale} days.`;

          summary.deadStock++;
        }

        //--------------------------------------------------
        // Stagnant
        //--------------------------------------------------
        else if (daysSinceLastSale >= 180) {
          status = "Stagnant";
          action = "Bundle Offer";
          priority = "High";

          reason = `Last sale was ${daysSinceLastSale} days ago.`;

          summary.stagnant++;
        }

        //--------------------------------------------------
        // Slow Moving
        //--------------------------------------------------
        else {
          status = "Slow Moving";
          action = "Flash Sale";
          priority = "Medium";

          reason = `Sales have slowed in the last ${daysSinceLastSale} days.`;

          summary.slowMoving++;
        }

        //--------------------------------------------------
        // Priority Count
        //--------------------------------------------------

        switch (priority) {
          case "Critical":
            summary.critical++;
            break;

          case "High":
            summary.high++;
            break;

          case "Medium":
            summary.medium++;
            break;

          case "Low":
            summary.low++;
            break;
        }

        return {
          bookId: book._id,
          title: book.title,
          author: book.author,
          category: book.category,
          price: book.price,
          stock: book.stock,

          totalSold,

          lastSoldAt,

          daysSinceLastSale,

          inventoryValue,

          status,

          priority,

          recommendedAction: action,

          reason,
        };
      })
      .sort((a, b) => {
        const priorityOrder = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };

        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        if (!a.lastSoldAt) return -1;
        if (!b.lastSoldAt) return 1;

        return new Date(a.lastSoldAt) - new Date(b.lastSoldAt);
      });

    // ---------------------------------------------------
    // Response
    // ---------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      deadDays,

      totalBooks: books.length,

      summary,

      inventory,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================================
// Demand Forecast Report
// GET /api/reports/demand-forecast
// =======================================================

router.get("/demand-forecast", async (req, res) => {
  try {
    const forecastDays = Number(req.query.days) || 30;

    //----------------------------------------------------
    // Date Range
    //----------------------------------------------------

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - forecastDays);

    //----------------------------------------------------
    // Aggregate Sales (Last N Days)
    //----------------------------------------------------

    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
          paidAt: { $gte: startDate },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.bookId",

          lastPeriodSold: {
            $sum: "$items.qty",
          },

          revenue: {
            $sum: {
              $multiply: ["$items.qty", "$items.price"],
            },
          },

          lastSale: {
            $max: "$paidAt",
          },
        },
      },
    ]);

    //----------------------------------------------------
    // Convert Aggregation to Map
    //----------------------------------------------------

    const salesMap = new Map();

    sales.forEach((item) => {
      salesMap.set(item._id.toString(), item);
    });

    //----------------------------------------------------
    // Load Books
    //----------------------------------------------------

    const books = await Book.find().lean();

    //----------------------------------------------------
    // Summary
    //----------------------------------------------------

    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,

      totalForecastDemand: 0,
      totalRecommendedOrder: 0,
    };

    //----------------------------------------------------
    // Forecast
    //----------------------------------------------------

    const forecast = books
      .map((book) => {
        const sale = salesMap.get(book._id.toString());

        const sold = sale?.lastPeriodSold || 0;

        const averageDailySales = Number((sold / forecastDays).toFixed(2));

        const predictedNextPeriod = Math.ceil(averageDailySales * forecastDays);

        const currentStock = book.stock || 0;

        const daysUntilOutOfStock =
          averageDailySales > 0
            ? Number((currentStock / averageDailySales).toFixed(1))
            : Infinity;

        const recommendedOrder = Math.max(
          0,
          predictedNextPeriod - currentStock,
        );

        let priority = "";
        let recommendation = "";

        //------------------------------------------------
        // Priority
        //------------------------------------------------

        if (averageDailySales === 0) {
          priority = "Low";
          recommendation = "No Demand";
        } else if (daysUntilOutOfStock <= 7) {
          priority = "Critical";
          recommendation = "Restock Immediately";
        } else if (daysUntilOutOfStock <= 15) {
          priority = "High";
          recommendation = "Restock Within One Week";
        } else if (daysUntilOutOfStock <= 30) {
          priority = "Medium";
          recommendation = "Plan Next Purchase";
        } else {
          priority = "Low";
          recommendation = "Current Stock Sufficient";
        }

        //------------------------------------------------
        // Summary
        //------------------------------------------------

        switch (priority) {
          case "Critical":
            summary.critical++;
            break;

          case "High":
            summary.high++;
            break;

          case "Medium":
            summary.medium++;
            break;

          case "Low":
            summary.low++;
            break;
        }

        summary.totalForecastDemand += predictedNextPeriod;

        summary.totalRecommendedOrder += recommendedOrder;

        //------------------------------------------------
        // Return
        //------------------------------------------------

        return {
          bookId: book._id,

          title: book.title,

          author: book.author,

          category: book.category,

          price: book.price,

          stock: currentStock,

          lastPeriodSold: sold,

          averageDailySales,

          predictedDemand: predictedNextPeriod,

          daysUntilOutOfStock:
            daysUntilOutOfStock === Infinity ? "No Sales" : daysUntilOutOfStock,

          recommendedOrder,

          revenue: sale?.revenue || 0,

          lastSale: sale?.lastSale || null,

          priority,

          recommendation,
        };
      })
      .sort((a, b) => {
        const priorityOrder = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };

        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        return b.recommendedOrder - a.recommendedOrder;
      });

    //----------------------------------------------------
    // Response
    //----------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      forecastPeriod: forecastDays,

      totalBooks: books.length,

      summary,

      forecast,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================================
// ABC Analysis Report
// GET /api/reports/abc-analysis
// =======================================================

router.get("/abc-analysis", async (req, res) => {
  try {
    //------------------------------------------------------
    // Aggregate Sales Revenue
    //------------------------------------------------------

    const sales = await Order.aggregate([
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
        $group: {
          _id: "$items.bookId",

          totalSold: {
            $sum: "$items.qty",
          },

          revenue: {
            $sum: {
              $multiply: ["$items.qty", "$items.price"],
            },
          },

          averageSellingPrice: {
            $avg: "$items.price",
          },

          lastSoldAt: {
            $max: "$paidAt",
          },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    //------------------------------------------------------
    // Load Books
    //------------------------------------------------------

    const books = await Book.find().lean();

    //------------------------------------------------------
    // Create Book Map
    //------------------------------------------------------

    const bookMap = new Map();

    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    //------------------------------------------------------
    // Total Revenue
    //------------------------------------------------------

    const totalRevenue = sales.reduce((sum, item) => sum + item.revenue, 0);

    //------------------------------------------------------
    // Summary
    //------------------------------------------------------

    const summary = {
      totalRevenue,

      totalBooks: books.length,

      soldBooks: sales.length,

      classA: 0,

      classB: 0,

      classC: 0,
    };

    //------------------------------------------------------
    // Running Revenue
    //------------------------------------------------------

    let cumulativeRevenue = 0;

    //------------------------------------------------------
    // Analysis
    //------------------------------------------------------

    const analysis = sales.map((sale) => {
      const book = bookMap.get(sale._id.toString());

      cumulativeRevenue += sale.revenue;

      const revenuePercent =
        totalRevenue === 0
          ? 0
          : Number(((sale.revenue / totalRevenue) * 100).toFixed(2));

      const cumulativePercent =
        totalRevenue === 0
          ? 0
          : Number(((cumulativeRevenue / totalRevenue) * 100).toFixed(2));

      //--------------------------------------------------
      // ABC Classification
      //--------------------------------------------------

      let classification = "";
      let recommendation = "";
      let priority = "";

      if (cumulativePercent <= 80) {
        classification = "A";

        priority = "Critical";

        recommendation = "Always Keep in Stock";

        summary.classA++;
      } else if (cumulativePercent <= 95) {
        classification = "B";

        priority = "High";

        recommendation = "Monitor Weekly";

        summary.classB++;
      } else {
        classification = "C";

        priority = "Medium";

        recommendation = "Order Only When Required";

        summary.classC++;
      }

      //--------------------------------------------------
      // Inventory Value
      //--------------------------------------------------

      const inventoryValue = (book?.stock || 0) * (book?.price || 0);

      //--------------------------------------------------
      // Turnover
      //--------------------------------------------------

      const turnoverRate =
        (book?.stock || 0) === 0
          ? sale.totalSold
          : Number((sale.totalSold / book.stock).toFixed(2));

      return {
        bookId: sale._id,

        title: book?.title || "Unknown",

        author: book?.author,

        category: book?.category,

        price: book?.price,

        stock: book?.stock,

        inventoryValue,

        totalSold: sale.totalSold,

        averageSellingPrice: Number(sale.averageSellingPrice.toFixed(2)),

        revenue: sale.revenue,

        revenuePercent,

        cumulativePercent,

        turnoverRate,

        lastSoldAt: sale.lastSoldAt,

        classification,

        priority,

        recommendation,
      };
    });
    //------------------------------------------------------
    // Include Unsold Books (Class C)
    //------------------------------------------------------

    const soldBookIds = new Set(sales.map((sale) => sale._id.toString()));

    books.forEach((book) => {
      if (!soldBookIds.has(book._id.toString())) {
        summary.classC++;

        analysis.push({
          bookId: book._id,

          title: book.title,

          author: book.author,

          category: book.category,

          price: book.price,

          stock: book.stock,

          inventoryValue: (book.stock || 0) * (book.price || 0),

          totalSold: 0,

          averageSellingPrice: 0,

          revenue: 0,

          revenuePercent: 0,

          cumulativePercent: 100,

          turnoverRate: 0,

          lastSoldAt: null,

          classification: "C",

          priority: "Low",

          recommendation: "Promote, Bundle or Consider Removal",
        });
      }
    });

    //------------------------------------------------------
    // Sort
    //------------------------------------------------------

    const priorityOrder = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    analysis.sort((a, b) => {
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      return b.revenue - a.revenue;
    });

    //------------------------------------------------------
    // Extra Summary
    //------------------------------------------------------

    summary.averageRevenue =
      analysis.length === 0
        ? 0
        : Number((summary.totalRevenue / analysis.length).toFixed(2));

    summary.totalInventoryValue = analysis.reduce(
      (sum, book) => sum + book.inventoryValue,
      0,
    );

    summary.totalUnitsSold = analysis.reduce(
      (sum, book) => sum + book.totalSold,
      0,
    );

    summary.topRevenueBook =
      analysis.length > 0
        ? {
            title: analysis[0].title,
            revenue: analysis[0].revenue,
          }
        : null;

    //------------------------------------------------------
    // Response
    //------------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      summary,

      analysis,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
});

// =======================================================
// Inventory Turnover Analysis
// GET /api/reports/inventory-turnover
// =======================================================

router.get("/inventory-turnover", async (req, res) => {
  try {
    //------------------------------------------------------
    // Aggregate Sales
    //------------------------------------------------------

    const sales = await Order.aggregate([
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
        $group: {
          _id: "$items.bookId",

          totalSold: {
            $sum: "$items.qty",
          },

          revenue: {
            $sum: {
              $multiply: ["$items.qty", "$items.price"],
            },
          },

          averageSellingPrice: {
            $avg: "$items.price",
          },

          totalOrders: {
            $sum: 1,
          },

          lastSoldAt: {
            $max: "$paidAt",
          },
        },
      },
    ]);

    //------------------------------------------------------
    // Load Books
    //------------------------------------------------------

    const books = await Book.find().lean();

    //------------------------------------------------------
    // Book Map
    //------------------------------------------------------

    const bookMap = new Map();

    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    //------------------------------------------------------
    // Summary
    //------------------------------------------------------

    const summary = {
      excellent: 0,

      good: 0,

      average: 0,

      poor: 0,

      dead: 0,

      totalRevenue: 0,

      totalUnitsSold: 0,

      totalInventoryValue: 0,

      averageTurnover: 0,
    };

    //------------------------------------------------------
    // Analysis
    //------------------------------------------------------

    const analysis = sales.map((sale) => {
      const book = bookMap.get(sale._id.toString());

      const stock = book?.stock || 0;

      const inventoryValue = stock * (book?.price || 0);

      //----------------------------------------------------
      // Inventory Turnover
      //----------------------------------------------------

      const turnover =
        stock === 0
          ? sale.totalSold
          : Number((sale.totalSold / stock).toFixed(2));

      //----------------------------------------------------
      // Rating
      //----------------------------------------------------

      let rating = "";

      let recommendation = "";

      let priority = "";

      if (turnover >= 8) {
        rating = "Excellent";

        recommendation = "Increase Stock";

        priority = "Critical";

        summary.excellent++;
      } else if (turnover >= 5) {
        rating = "Good";

        recommendation = "Maintain Stock";

        priority = "High";

        summary.good++;
      } else if (turnover >= 2) {
        rating = "Average";

        recommendation = "Monitor Sales";

        priority = "Medium";

        summary.average++;
      } else if (turnover >= 1) {
        rating = "Poor";

        recommendation = "Run Promotion";

        priority = "Medium";

        summary.poor++;
      } else {
        rating = "Dead";

        recommendation = "Heavy Discount";

        priority = "Low";

        summary.dead++;
      }

      //----------------------------------------------------
      // Summary
      //----------------------------------------------------

      summary.totalRevenue += sale.revenue;

      summary.totalUnitsSold += sale.totalSold;

      summary.totalInventoryValue += inventoryValue;

      summary.averageTurnover += turnover;

      //----------------------------------------------------
      // Return
      //----------------------------------------------------

      return {
        bookId: sale._id,

        title: book?.title || "Unknown",

        author: book?.author,

        category: book?.category,

        price: book?.price,

        stock,

        inventoryValue,

        unitsSold: sale.totalSold,

        totalOrders: sale.totalOrders,

        averageSellingPrice: Number(sale.averageSellingPrice.toFixed(2)),

        revenue: sale.revenue,

        turnover,

        rating,

        priority,

        recommendation,

        lastSoldAt: sale.lastSoldAt,
      };
    }); //------------------------------------------------------
    // Include Unsold Books
    //------------------------------------------------------

    const soldBookIds = new Set(sales.map((sale) => sale._id.toString()));

    books.forEach((book) => {
      if (!soldBookIds.has(book._id.toString())) {
        const inventoryValue = (book.stock || 0) * (book.price || 0);

        summary.dead++;
        summary.totalInventoryValue += inventoryValue;

        analysis.push({
          bookId: book._id,

          title: book.title,

          author: book.author,

          category: book.category,

          price: book.price,

          stock: book.stock,

          inventoryValue,

          unitsSold: 0,

          totalOrders: 0,

          averageSellingPrice: 0,

          revenue: 0,

          turnover: 0,

          rating: "Dead",

          priority: "Low",

          recommendation: "Promote, Bundle or Consider Removal",

          lastSoldAt: null,
        });
      }
    });

    //------------------------------------------------------
    // Average Turnover
    //------------------------------------------------------

    summary.averageTurnover =
      analysis.length === 0
        ? 0
        : Number((summary.averageTurnover / analysis.length).toFixed(2));

    //------------------------------------------------------
    // Top Performers
    //------------------------------------------------------

    const topSellingBook =
      analysis.length > 0
        ? analysis.reduce((best, current) =>
            current.unitsSold > best.unitsSold ? current : best,
          )
        : null;

    const fastestMovingBook =
      analysis.length > 0
        ? analysis.reduce((best, current) =>
            current.turnover > best.turnover ? current : best,
          )
        : null;

    const highestRevenueBook =
      analysis.length > 0
        ? analysis.reduce((best, current) =>
            current.revenue > best.revenue ? current : best,
          )
        : null;

    summary.topSellingBook = topSellingBook
      ? {
          title: topSellingBook.title,
          unitsSold: topSellingBook.unitsSold,
        }
      : null;

    summary.fastestMovingBook = fastestMovingBook
      ? {
          title: fastestMovingBook.title,
          turnover: fastestMovingBook.turnover,
        }
      : null;

    summary.highestRevenueBook = highestRevenueBook
      ? {
          title: highestRevenueBook.title,
          revenue: highestRevenueBook.revenue,
        }
      : null;

    //------------------------------------------------------
    // Sort
    //------------------------------------------------------

    const priorityOrder = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    analysis.sort((a, b) => {
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      return b.turnover - a.turnover;
    });

    //------------------------------------------------------
    // Response
    //------------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      totalBooks: books.length,

      summary,

      analysis,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message,
    });
  }
});

// =======================================================
// Smart Restock Recommendation
// GET /api/reports/restock-recommendations
// =======================================================

router.get("/restock-recommendations", async (req, res) => {
  try {
    //-----------------------------------------------------
    // Configuration
    //-----------------------------------------------------

    const forecastDays = Number(req.query.days) || 30;

    const safetyStockPercent = Number(req.query.safetyStock) || 20;

    //-----------------------------------------------------
    // Date Range
    //-----------------------------------------------------

    const startDate = new Date();

    startDate.setDate(startDate.getDate() - forecastDays);

    //-----------------------------------------------------
    // Aggregate Sales
    //-----------------------------------------------------

    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
          paidAt: {
            $gte: startDate,
          },
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.bookId",

          totalSold: {
            $sum: "$items.qty",
          },

          revenue: {
            $sum: {
              $multiply: ["$items.qty", "$items.price"],
            },
          },

          totalOrders: {
            $sum: 1,
          },

          averageSellingPrice: {
            $avg: "$items.price",
          },

          lastSoldAt: {
            $max: "$paidAt",
          },
        },
      },
    ]);

    //-----------------------------------------------------
    // Sales Map
    //-----------------------------------------------------

    const salesMap = new Map();

    sales.forEach((sale) => {
      salesMap.set(sale._id.toString(), sale);
    });

    //-----------------------------------------------------
    // Load Books
    //-----------------------------------------------------

    const books = await Book.find().lean();

    //-----------------------------------------------------
    // Summary
    //-----------------------------------------------------

    const summary = {
      critical: 0,

      high: 0,

      medium: 0,

      low: 0,

      totalRecommendedBooks: 0,

      recommendedPurchaseBudget: 0,

      totalForecastDemand: 0,

      totalRecommendedQuantity: 0,
    };

    //-----------------------------------------------------
    // Recommendation
    //-----------------------------------------------------

    const recommendations = books.map((book) => {
      const sale = salesMap.get(book._id.toString());

      //--------------------------------------------------
      // Sales
      //--------------------------------------------------

      const sold = sale?.totalSold || 0;

      const currentStock = book.stock || 0;

      //--------------------------------------------------
      // Forecast
      //--------------------------------------------------

      const averageDailySales = Number((sold / forecastDays).toFixed(2));

      const forecastDemand = Math.ceil(averageDailySales * forecastDays);

      //--------------------------------------------------
      // Safety Stock
      //--------------------------------------------------

      const safetyStock = Math.ceil(
        forecastDemand * (safetyStockPercent / 100),
      );

      //--------------------------------------------------
      // Days Until Stockout
      //--------------------------------------------------

      const daysUntilStockout =
        averageDailySales > 0
          ? Number((currentStock / averageDailySales).toFixed(1))
          : Infinity;

      //--------------------------------------------------
      // Recommended Quantity
      //--------------------------------------------------

      const recommendedOrder = Math.max(
        0,
        forecastDemand + safetyStock - currentStock,
      );

      //--------------------------------------------------
      // Turnover
      //--------------------------------------------------

      const turnover =
        currentStock === 0 ? sold : Number((sold / currentStock).toFixed(2));

      //--------------------------------------------------
      // Inventory Value
      //--------------------------------------------------

      const inventoryValue = currentStock * (book.price || 0);

      //--------------------------------------------------
      // Purchase Cost
      //--------------------------------------------------

      const purchaseBudget = recommendedOrder * (book.price || 0);
      //--------------------------------------------------
      // ABC Importance (Revenue Based)
      //--------------------------------------------------

      let abcClass = "C";

      if (sale) {
        if (sale.revenue >= 100000) {
          abcClass = "A";
        } else if (sale.revenue >= 30000) {
          abcClass = "B";
        }
      }

      //--------------------------------------------------
      // Priority Engine
      //--------------------------------------------------

      let priority = "Low";

      let recommendation = "No Restock Needed";

      const reasons = [];

      //--------------------------------------------------
      // Critical
      //--------------------------------------------------

      if (recommendedOrder > 0 && daysUntilStockout <= 7) {
        priority = "Critical";

        recommendation = "Restock Immediately";

        reasons.push("Stock will finish within 7 days");
      }

      //--------------------------------------------------
      // High
      //--------------------------------------------------
      else if (recommendedOrder > 0 && daysUntilStockout <= 15) {
        priority = "High";

        recommendation = "Restock Within One Week";

        reasons.push("High demand expected");
      }

      //--------------------------------------------------
      // Medium
      //--------------------------------------------------
      else if (recommendedOrder > 0 && daysUntilStockout <= 30) {
        priority = "Medium";

        recommendation = "Plan Next Purchase";

        reasons.push("Inventory expected to reduce within a month");
      }

      //--------------------------------------------------
      // Low
      //--------------------------------------------------
      else {
        priority = "Low";

        recommendation = "Current Inventory Sufficient";
      }

      //--------------------------------------------------
      // Business Intelligence
      //--------------------------------------------------

      if (forecastDemand > currentStock) {
        reasons.push("Forecast demand exceeds current stock");
      }

      if (turnover >= 8) {
        reasons.push("Excellent inventory turnover");
      } else if (turnover >= 5) {
        reasons.push("Good inventory turnover");
      }

      if (abcClass === "A") {
        reasons.push("High revenue generating book");
      }

      if (currentStock === 0 && sold > 0) {
        reasons.push("Currently out of stock");
      }

      if (sold === 0 && currentStock > 0) {
        reasons.push("No recent demand");
      }

      //--------------------------------------------------
      // Summary
      //--------------------------------------------------

      switch (priority) {
        case "Critical":
          summary.critical++;
          break;

        case "High":
          summary.high++;
          break;

        case "Medium":
          summary.medium++;
          break;

        case "Low":
          summary.low++;
          break;
      }

      if (recommendedOrder > 0) {
        summary.totalRecommendedBooks++;

        summary.totalRecommendedQuantity += recommendedOrder;

        summary.recommendedPurchaseBudget += purchaseBudget;
      }

      summary.totalForecastDemand += forecastDemand;

      //--------------------------------------------------
      // Return
      //--------------------------------------------------

      return {
        bookId: book._id,

        title: book.title,

        author: book.author,

        category: book.category,

        price: book.price,

        currentStock,

        inventoryValue,

        totalSold: sold,

        averageDailySales,

        forecastDemand,

        safetyStock,

        recommendedOrder,

        purchaseBudget,

        turnover,

        abcClass,

        daysUntilStockout:
          daysUntilStockout === Infinity ? "No Sales" : daysUntilStockout,

        priority,

        recommendation,

        reasons,

        lastSoldAt: sale?.lastSoldAt || null,
      };
    });
    //-----------------------------------------------------
    // Summary Calculations
    //-----------------------------------------------------

    summary.averageForecastDemand =
      books.length === 0
        ? 0
        : Number((summary.totalForecastDemand / books.length).toFixed(2));

    summary.averageRecommendedQuantity =
      summary.totalRecommendedBooks === 0
        ? 0
        : Number(
            (
              summary.totalRecommendedQuantity / summary.totalRecommendedBooks
            ).toFixed(2),
          );

    //-----------------------------------------------------
    // Priority Sort
    //-----------------------------------------------------

    const priorityOrder = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    recommendations.sort((a, b) => {
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      if (b.recommendedOrder !== a.recommendedOrder) {
        return b.recommendedOrder - a.recommendedOrder;
      }

      return b.forecastDemand - a.forecastDemand;
    });

    //-----------------------------------------------------
    // Top Recommendations
    //-----------------------------------------------------

    const criticalBooks = recommendations.filter(
      (book) => book.priority === "Critical",
    );

    const highBooks = recommendations.filter(
      (book) => book.priority === "High",
    );

    const mediumBooks = recommendations.filter(
      (book) => book.priority === "Medium",
    );

    const lowBooks = recommendations.filter((book) => book.priority === "Low");

    //-----------------------------------------------------
    // Top Purchase Recommendation
    //-----------------------------------------------------

    summary.topRecommendation =
      recommendations.length > 0
        ? {
            title: recommendations[0].title,
            recommendedOrder: recommendations[0].recommendedOrder,
            priority: recommendations[0].priority,
            purchaseBudget: recommendations[0].purchaseBudget,
          }
        : null;

    //-----------------------------------------------------
    // Response
    //-----------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      forecastPeriod: forecastDays,

      safetyStockPercent,

      summary,

      recommendations,

      priorityBreakdown: {
        critical: criticalBooks,

        high: highBooks,

        medium: mediumBooks,

        low: lowBooks,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message || "Unable to generate restock recommendations.",
    });
  }
});

// ======================================================
// Sales Analytics Dashboard
// GET /api/reports/sales-analytics
// ======================================================

router.get("/sales-analytics", async (req, res) => {
  try {
    //--------------------------------------------------
    // Configuration
    //--------------------------------------------------

    const days = Number(req.query.days) || 30;

    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);

    //--------------------------------------------------
    // Fetch Orders
    //--------------------------------------------------

    const orders = await Order.find({
      paymentStatus: "paid",
      status: { $ne: "cancelled" },
      paidAt: { $gte: startDate },
    }).lean();

    //--------------------------------------------------
    // KPIs
    //--------------------------------------------------

    let totalRevenue = 0;

    let totalOrders = orders.length;

    let totalBooksSold = 0;

    let totalItems = 0;

    orders.forEach((order) => {
      totalRevenue += order.totalAmount || 0;

      order.items.forEach((item) => {
        totalBooksSold += item.qty;

        totalItems++;
      });
    });

    const averageOrderValue =
      totalOrders === 0 ? 0 : Number((totalRevenue / totalOrders).toFixed(2));

    const averageBooksPerOrder =
      totalOrders === 0 ? 0 : Number((totalBooksSold / totalOrders).toFixed(2));

    //--------------------------------------------------
    // Revenue Trend
    //--------------------------------------------------

    const revenueTrend = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          status: {
            $ne: "cancelled",
          },

          paidAt: {
            $gte: startDate,
          },
        },
      },

      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",

              date: "$paidAt",
            },
          },

          totalAmount: 1,

          items: 1,
        },
      },

      {
        $group: {
          _id: "$date",

          revenue: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },

          booksSold: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: {
                  $add: ["$$value", "$$this.qty"],
                },
              },
            },
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    //--------------------------------------------------
    // Monthly Revenue
    //--------------------------------------------------

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          status: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$paidAt",
            },

            month: {
              $month: "$paidAt",
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
          "_id.year": 1,

          "_id.month": 1,
        },
      },
    ]);

    //--------------------------------------------------
    // Summary Object
    //--------------------------------------------------

    const summary = {
      totalRevenue,

      totalOrders,

      totalBooksSold,

      averageOrderValue,

      averageBooksPerOrder,
    };
    //--------------------------------------------------
    // Top Selling Books
    //--------------------------------------------------

    const topSellingBooks = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
          paidAt: { $gte: startDate },
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.bookId",

          title: {
            $first: "$items.title",
          },

          quantity: {
            $sum: "$items.qty",
          },

          revenue: {
            $sum: {
              $multiply: ["$items.qty", "$items.price"],
            },
          },

          averagePrice: {
            $avg: "$items.price",
          },
        },
      },

      {
        $sort: {
          quantity: -1,
        },
      },

      {
        $limit: 10,
      },
    ]);

    //--------------------------------------------------
    // Top Categories
    //--------------------------------------------------

    const topCategories = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
          paidAt: { $gte: startDate },
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

          booksSold: {
            $sum: "$items.qty",
          },

          revenue: {
            $sum: {
              $multiply: ["$items.qty", "$items.price"],
            },
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    //--------------------------------------------------
    // Payment Analytics
    //--------------------------------------------------

    const paymentAnalytics = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          paidAt: { $gte: startDate },
        },
      },

      {
        $group: {
          _id: "$paymentMethod",

          orders: {
            $sum: 1,
          },

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const paymentMethods = {};

    paymentAnalytics.forEach((item) => {
      paymentMethods[item._id || "Unknown"] = {
        orders: item.orders,

        revenue: Number(item.revenue.toFixed(2)),
      };
    });

    //--------------------------------------------------
    // Order Status Analytics
    //--------------------------------------------------

    const statusAnalytics = await Order.aggregate([
      {
        $match: {
          paidAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const orderStatus = {};

    statusAnalytics.forEach((item) => {
      orderStatus[item._id || "Unknown"] = item.count;
    });

    //--------------------------------------------------
    // Revenue Distribution
    //--------------------------------------------------

    const revenueDistribution = {
      "0-500": 0,

      "500-1000": 0,

      "1000-5000": 0,

      "5000+": 0,
    };

    orders.forEach((order) => {
      const amount = order.totalAmount || 0;

      if (amount < 500) {
        revenueDistribution["0-500"]++;
      } else if (amount < 1000) {
        revenueDistribution["500-1000"]++;
      } else if (amount < 5000) {
        revenueDistribution["1000-5000"]++;
      } else {
        revenueDistribution["5000+"]++;
      }
    });

    //--------------------------------------------------
    // Top Customers
    //--------------------------------------------------

    const topCustomers = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          status: {
            $ne: "cancelled",
          },

          paidAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: "$userId",

          totalOrders: {
            $sum: 1,
          },

          totalSpent: {
            $sum: "$totalAmount",
          },

          averageOrderValue: {
            $avg: "$totalAmount",
          },
        },
      },

      {
        $lookup: {
          from: "users",

          localField: "_id",

          foreignField: "_id",

          as: "user",
        },
      },

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,

          name: "$user.name",

          email: "$user.email",

          totalOrders: 1,

          totalSpent: {
            $round: ["$totalSpent", 2],
          },

          averageOrderValue: {
            $round: ["$averageOrderValue", 2],
          },
        },
      },

      {
        $sort: {
          totalSpent: -1,
        },
      },

      {
        $limit: 10,
      },
    ]);
    //--------------------------------------------------
    // Best & Worst Sales Day
    //--------------------------------------------------

    let bestSalesDay = null;
    let worstSalesDay = null;

    if (revenueTrend.length > 0) {
      const formattedTrend = revenueTrend.map((day) => ({
        date: day._id,

        revenue: day.revenue,

        orders: day.orders,

        booksSold: day.booksSold,
      }));

      bestSalesDay = formattedTrend.reduce((best, current) =>
        current.revenue > best.revenue ? current : best,
      );

      worstSalesDay = formattedTrend.reduce((worst, current) =>
        current.revenue < worst.revenue ? current : worst,
      );
    }

    //--------------------------------------------------
    // Sales Growth
    //--------------------------------------------------

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    const todayRevenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          status: {
            $ne: "cancelled",
          },

          paidAt: {
            $gte: today,

            $lt: tomorrow,
          },
        },
      },

      {
        $group: {
          _id: null,

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const yesterdayRevenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          status: {
            $ne: "cancelled",
          },

          paidAt: {
            $gte: yesterday,

            $lt: today,
          },
        },
      },

      {
        $group: {
          _id: null,

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const todayRevenue = todayRevenueResult[0]?.revenue || 0;

    const yesterdayRevenue = yesterdayRevenueResult[0]?.revenue || 0;

    const salesGrowth =
      yesterdayRevenue === 0
        ? 100
        : Number(
            (
              ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) *
              100
            ).toFixed(2),
          );

    //--------------------------------------------------
    // Dashboard Summary
    //--------------------------------------------------

    const dashboard = {
      bestSellingBook: topSellingBooks.length > 0 ? topSellingBooks[0] : null,

      bestCategory: topCategories.length > 0 ? topCategories[0] : null,

      bestSalesDay,

      worstSalesDay,

      totalCustomers: topCustomers.length,

      repeatCustomers: topCustomers.filter(
        (customer) => customer.totalOrders > 1,
      ).length,

      salesGrowth: {
        todayRevenue,

        yesterdayRevenue,

        growthPercentage: salesGrowth,
      },
    };

    //--------------------------------------------------
    // Format Revenue Trend
    //--------------------------------------------------

    const formattedRevenueTrend = revenueTrend.map((day) => ({
      date: day._id,

      revenue: Number(day.revenue.toFixed(2)),

      orders: day.orders,

      booksSold: day.booksSold,
    }));

    //--------------------------------------------------
    // Format Monthly Revenue
    //--------------------------------------------------

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedMonthlyRevenue = monthlyRevenue.map((month) => ({
      year: month._id.year,

      month: monthNames[month._id.month - 1],

      revenue: Number(month.revenue.toFixed(2)),

      orders: month.orders,
    }));

    //--------------------------------------------------
    // Final Response
    //--------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      period: {
        days,

        startDate,

        endDate: new Date(),
      },

      summary,

      dashboard,

      revenueTrend: formattedRevenueTrend,

      monthlyRevenue: formattedMonthlyRevenue,

      topSellingBooks,

      topCategories,

      paymentMethods,

      orderStatus,

      revenueDistribution,

      topCustomers,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message || "Unable to generate sales analytics.",
    });
  }
});


// ======================================================
// Customer Analytics Dashboard
// GET /api/reports/customer-analytics
// ======================================================

router.get("/customer-analytics", async (req, res) => {
  try {
    //--------------------------------------------------
    // Configuration
    //--------------------------------------------------

    const days = Number(req.query.days) || 365;

    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);

    //--------------------------------------------------
    // Fetch Orders
    //--------------------------------------------------

    const orders = await Order.find({
      paymentStatus: "paid",

      status: {
        $ne: "cancelled",
      },

      paidAt: {
        $gte: startDate,
      },
    })
      .sort({ paidAt: 1 })
      .lean();

    //--------------------------------------------------
    // Customer Map
    //--------------------------------------------------

    const customerMap = new Map();

    //--------------------------------------------------
    // Process Orders
    //--------------------------------------------------

    orders.forEach((order) => {
      if (!order.userId) return;
      const id = order.userId.toString();

      if (!customerMap.has(id)) {
        customerMap.set(id, {
          userId: id,

          orders: 0,

          totalSpent: 0,

          booksPurchased: 0,

          firstPurchase: order.paidAt,

          lastPurchase: order.paidAt,

          purchaseDates: [],

          categoryCount: {},
        });
      }

      const customer = customerMap.get(id);

      customer.orders++;

      customer.totalSpent += order.totalAmount || 0;

      customer.purchaseDates.push(order.paidAt);

      if (order.paidAt > customer.lastPurchase) {
        customer.lastPurchase = order.paidAt;
      }

      if (order.paidAt < customer.firstPurchase) {
        customer.firstPurchase = order.paidAt;
      }

      order.items.forEach((item) => {
        customer.booksPurchased += item.qty;
      });
    });

    //--------------------------------------------------
    // Load Users
    //--------------------------------------------------

    const users = await User.find({
      _id: {
        $in: Array.from(customerMap.keys()),
      },
    }).lean();

    const userMap = new Map();

    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    //--------------------------------------------------
    // KPIs
    //--------------------------------------------------

    const totalCustomers = customerMap.size;

    let repeatCustomers = 0;

    let activeCustomers = 0;

    let totalCustomerValue = 0;

    let highestCLV = 0;

    let highestCustomer = null;

    const today = new Date();

    //--------------------------------------------------
    // Analytics
    //--------------------------------------------------

    const analytics = Array.from(customerMap.values()).map((customer) => {
      const user = userMap.get(customer.userId);

      //------------------------------------------
      // Recency
      //------------------------------------------

      const recency = Math.floor(
        (today - customer.lastPurchase) / (1000 * 60 * 60 * 24),
      );

      //------------------------------------------
      // Frequency
      //------------------------------------------

      const frequency = customer.orders;

      //------------------------------------------
      // Monetary
      //------------------------------------------

      const monetary = Number(customer.totalSpent.toFixed(2));

      //------------------------------------------
      // CLV
      //------------------------------------------

      const averageOrderValue = monetary / frequency;

      const clv = Number((averageOrderValue * frequency).toFixed(2));

      totalCustomerValue += clv;

      if (clv > highestCLV) {
        highestCLV = clv;

        highestCustomer = user?.name || "Unknown";
      }

      //------------------------------------------
      // Repeat Customer
      //------------------------------------------

      if (frequency > 1) {
        repeatCustomers++;
      }

      //------------------------------------------
      // Active Customer
      //------------------------------------------

      if (recency <= 90) {
        activeCustomers++;
      }

      //------------------------------------------
      // Purchase Interval
      //------------------------------------------

      let averagePurchaseInterval = 0;

      if (customer.purchaseDates.length > 1) {
        let totalGap = 0;

        for (let i = 1; i < customer.purchaseDates.length; i++) {
          totalGap +=
            (customer.purchaseDates[i] - customer.purchaseDates[i - 1]) /
            (1000 * 60 * 60 * 24);
        }

        averagePurchaseInterval = Number(
          (totalGap / (customer.purchaseDates.length - 1)).toFixed(2),
        );
      }

      //------------------------------------------
      // Average Order Value
      //------------------------------------------

      const averageSpent = Number((monetary / frequency).toFixed(2));
      //------------------------------------------
      // Customer Segment
      //------------------------------------------

      let segment = "New Customer";

      if (recency <= 30 && frequency >= 10 && monetary >= 20000) {
        segment = "Champion";
      } else if (recency <= 60 && frequency >= 5) {
        segment = "Loyal Customer";
      } else if (recency <= 90 && frequency >= 3) {
        segment = "Potential Loyalist";
      } else if (recency > 90 && recency <= 180) {
        segment = "Need Attention";
      } else if (recency > 180 && recency <= 365) {
        segment = "At Risk";
      } else if (recency > 365) {
        segment = "Lost Customer";
      }

      //------------------------------------------
      // Churn Risk
      //------------------------------------------

      let churnRisk = "Low";

      if (recency > 365) {
        churnRisk = "Very High";
      } else if (recency > 180) {
        churnRisk = "High";
      } else if (recency > 90) {
        churnRisk = "Medium";
      }

      //------------------------------------------
      // Purchase Frequency
      //------------------------------------------

      let purchaseFrequency = "Rare";

      if (averagePurchaseInterval <= 15) {
        purchaseFrequency = "Very Frequent";
      } else if (averagePurchaseInterval <= 30) {
        purchaseFrequency = "Frequent";
      } else if (averagePurchaseInterval <= 60) {
        purchaseFrequency = "Regular";
      }

      //------------------------------------------
      // Favorite Category
      //------------------------------------------

      let favoriteCategory = "Unknown";

      if (
        customer.categoryCount &&
        Object.keys(customer.categoryCount).length > 0
      ) {
        favoriteCategory = Object.entries(customer.categoryCount).sort(
          (a, b) => b[1] - a[1],
        )[0][0];
      }

      //------------------------------------------
      // Recommendation
      //------------------------------------------

      let recommendation = "";

      switch (segment) {
        case "Champion":
          recommendation = "Reward with exclusive loyalty benefits.";

          break;

        case "Loyal Customer":
          recommendation = "Provide early access to new arrivals.";

          break;

        case "Potential Loyalist":
          recommendation = "Offer personalized discounts.";

          break;

        case "Need Attention":
          recommendation = "Send reminder emails and recommendations.";

          break;

        case "At Risk":
          recommendation = "Launch win-back campaigns.";

          break;

        case "Lost Customer":
          recommendation = "Offer special comeback discounts.";

          break;

        default:
          recommendation = "Welcome and encourage another purchase.";
      }

      //------------------------------------------
      // Return Object
      //------------------------------------------

      return {
        userId: customer.userId,

        name: user?.name || "Unknown",

        email: user?.email || "",

        totalOrders: frequency,

        booksPurchased: customer.booksPurchased,

        totalSpent: monetary,

        averageOrderValue: averageSpent,

        customerLifetimeValue: clv,

        recency,

        frequency,

        monetary,

        averagePurchaseInterval,

        purchaseFrequency,

        favoriteCategory,

        segment,

        churnRisk,

        recommendation,

        firstPurchase: customer.firstPurchase,

        lastPurchase: customer.lastPurchase,
      };
    });

    //--------------------------------------------------
    // Customer Segments Summary
    //--------------------------------------------------

    const segmentSummary = {
      champions: 0,

      loyalCustomers: 0,

      potentialLoyalists: 0,

      needAttention: 0,

      atRisk: 0,

      lostCustomers: 0,

      newCustomers: 0,
    };

    analytics.forEach((customer) => {
      switch (customer.segment) {
        case "Champion":
          segmentSummary.champions++;

          break;

        case "Loyal Customer":
          segmentSummary.loyalCustomers++;

          break;

        case "Potential Loyalist":
          segmentSummary.potentialLoyalists++;

          break;

        case "Need Attention":
          segmentSummary.needAttention++;

          break;

        case "At Risk":
          segmentSummary.atRisk++;

          break;

        case "Lost Customer":
          segmentSummary.lostCustomers++;

          break;

        default:
          segmentSummary.newCustomers++;
      }
    });

    //--------------------------------------------------
    // Churn Summary
    //--------------------------------------------------

    const churnSummary = {
      low: analytics.filter((c) => c.churnRisk === "Low").length,

      medium: analytics.filter((c) => c.churnRisk === "Medium").length,

      high: analytics.filter((c) => c.churnRisk === "High").length,

      veryHigh: analytics.filter((c) => c.churnRisk === "Very High").length,
    };
    //--------------------------------------------------
    // Monthly Customer Growth
    //--------------------------------------------------

    const monthlyGrowth = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$userId",
          firstPurchase: {
            $min: "$paidAt",
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$firstPurchase",
            },
            month: {
              $month: "$firstPurchase",
            },
          },
          newCustomers: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    //--------------------------------------------------
    // Overall KPIs
    //--------------------------------------------------

    const retentionRate =
      totalCustomers === 0
        ? 0
        : Number(((repeatCustomers / totalCustomers) * 100).toFixed(2));

    const averageCustomerValue =
      totalCustomers === 0
        ? 0
        : Number((totalCustomerValue / totalCustomers).toFixed(2));

    //--------------------------------------------------
    // Top Customers
    //--------------------------------------------------

    analytics.sort((a, b) => {
      if (b.customerLifetimeValue !== a.customerLifetimeValue) {
        return b.customerLifetimeValue - a.customerLifetimeValue;
      }

      return b.totalSpent - a.totalSpent;
    });

    const topCustomers = analytics.slice(0, 10);

    //--------------------------------------------------
    // Dashboard Summary
    //--------------------------------------------------

    const dashboard = {
      bestCustomer:
        topCustomers.length > 0
          ? {
              name: topCustomers[0].name,
              totalSpent: topCustomers[0].totalSpent,
              customerLifetimeValue: topCustomers[0].customerLifetimeValue,
            }
          : null,

      highestCLV: {
        customer: highestCustomer,

        value: highestCLV,
      },

      champions: segmentSummary.champions,

      loyalCustomers: segmentSummary.loyalCustomers,

      potentialLoyalists: segmentSummary.potentialLoyalists,

      atRisk: segmentSummary.atRisk,

      lostCustomers: segmentSummary.lostCustomers,

      repeatCustomers,

      activeCustomers,
    };

    //--------------------------------------------------
    // Summary
    //--------------------------------------------------

    const summary = {
      totalCustomers,

      activeCustomers,

      repeatCustomers,

      retentionRate,

      averageCustomerValue,

      averageCLV: averageCustomerValue,
    };

    //--------------------------------------------------
    // Format Monthly Growth
    //--------------------------------------------------

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedMonthlyGrowth = monthlyGrowth.map((item) => ({
      year: item._id.year,

      month: monthNames[item._id.month - 1],

      newCustomers: item.newCustomers,
    }));

    //--------------------------------------------------
    // Final Response
    //--------------------------------------------------

    res.json({
      success: true,

      generatedAt: new Date(),

      period: {
        days,

        startDate,

        endDate: new Date(),
      },

      summary,

      dashboard,

      customerSegments: segmentSummary,

      churn: churnSummary,

      monthlyGrowth: formattedMonthlyGrowth,

      topCustomers,

      customers: analytics,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,

      message: err.message || "Unable to generate customer analytics.",
    });
  }
});

/* ============================================================
   EXPORT ROUTER
   ============================================================ */

module.exports = router;
