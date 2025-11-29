// backend/models/Order.js
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: String,
  qty: Number,
  price: Number
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: String,
  userIdName: String,
  items: [OrderItemSchema],
  subtotal: Number,
  discount: { type: Number, default: 0 },
  totalAmount: Number,
  promotionCode: { type: String, default: null },
  status: { 
  type: String, 
  enum: ['payment_pending', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'], // <--- Added here
  default: 'payment_pending' 
},
  shippingAddress: String,
  paymentId: { type: String } // <--- ADD THIS LINE
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);