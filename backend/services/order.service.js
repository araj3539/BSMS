const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Order = require("../models/Order");
const Book = require("../models/Book");

class OrderService {
  /**
   * Cancel an order.
   * Handles Stripe refund, inventory restoration,
   * payment status, and cancellation timestamp.
   */
  async cancelOrder(orderId) {
    const order = await Order.findById(orderId);

    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    //------------------------------------------------
    // Prevent duplicate cancellation
    //------------------------------------------------

    if (order.status === "cancelled") {
      const error = new Error("Order is already cancelled");
      error.statusCode = 400;
      throw error;
    }

    //------------------------------------------------
    // Prevent cancellation after shipping/delivery
    //------------------------------------------------

    if (order.status === "shipped" || order.status === "delivered") {
      const error = new Error(
        `Cannot cancel an order with status ${order.status}`,
      );

      error.statusCode = 400;
      throw error;
    }

    //------------------------------------------------
    // Refund Stripe payment
    //------------------------------------------------

    if (
      order.paymentMethod === "stripe" &&
      order.paymentStatus === "paid" &&
      order.paymentId
    ) {
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentId,
        metadata: {
          orderId: order._id.toString(),
        },
      });

      // Stripe refund creation was successful.
      // For this project we mark the payment refunded here.
      order.paymentStatus = "refunded";
      order.refundId = refund.id;
      order.refundedAt = new Date();

      console.log(
        `[Order Refund] Refund ${refund.id} created for Order ${order._id}`,
      );
    }

    //------------------------------------------------
    // Restore inventory
    //------------------------------------------------

    // Stock was deducted only after successful payment.
    // Restore it only for orders whose payment was processed.

    const shouldRestoreInventory =
      order.paymentStatus === "refunded" ||
      (order.paymentMethod !== "stripe" && order.paymentStatus === "paid");

    if (shouldRestoreInventory) {
      const bulkOps = order.items.map((item) => ({
        updateOne: {
          filter: {
            _id: item.bookId,
          },

          update: {
            $inc: {
              stock: item.qty,
              soldCount: -item.qty,
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await Book.bulkWrite(bulkOps);
      }
    }

    //------------------------------------------------
    // Cancel Order
    //------------------------------------------------

    order.status = "cancelled";
    order.cancelledAt = new Date();

    await order.save();

    return order;
  }
}

module.exports = new OrderService();
