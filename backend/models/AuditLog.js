const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  action: { type: String, required: true }, // e.g., "CREATE_BOOK", "DELETE_ORDER"
  method: String,
  endpoint: String,
  details: mongoose.Schema.Types.Mixed, // Capture req.body or specific changes
  ip: String,
  status: Number
}, { timestamps: true });

// Auto-expire logs after 90 days to save space
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);