// backend/models/Promotion.js
const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, unique: true, trim: true },
  type: { type: String, enum: ['percent','flat'], default: 'percent' },
  value: { type: Number, required: true }, // percent (0-100) or flat amount
  minOrderValue: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Promotion', PromotionSchema);
