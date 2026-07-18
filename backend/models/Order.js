const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
    
    authors: [String],
    categories: [String],

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Snapshot of customer information at order time
    userEmail: {
      type: String,
      required: true,
      trim: true,
    },

    userIdName: {
      type: String,
      trim: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    promotionCode: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "payment_pending",
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "payment_pending",
      index: true,
    },

    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },

    paymentId: {
      type: String,
      default: null,
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["stripe", "cod"],
      default: "stripe",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refundId: {
      type: String,
      default: null,
      index: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// User order history
OrderSchema.index({
  userId: 1,
  createdAt: -1,
});

// Admin order filtering
OrderSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Order", OrderSchema);
