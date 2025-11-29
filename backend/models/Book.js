// backend/models/Book.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  comment: { type: String, required: true },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // <--- NEW FIELD
  replies: [ReplySchema]
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  isbn: { type: String },
  description: { type: String },
  coverImageUrl: { type: String },
  ebookUrl: { type: String },
  audiobookUrl: { type: String },
  soldCount: { type: Number, default: 0 },

  reviews: [ReviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Book', BookSchema);