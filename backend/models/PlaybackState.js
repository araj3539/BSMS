const mongoose = require('mongoose');

const PlaybackStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  trackIndex: { type: Number, default: 0 },
  currentTime: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index to ensure we only have one state per user-book combination
PlaybackStateSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('PlaybackState', PlaybackStateSchema);