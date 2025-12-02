const AuditLog = require('../models/AuditLog');

// --- 1. REQUIRE ADMIN (Authorization) ---
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ msg: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    // Log unauthorized access attempts
    logAudit(req, 'UNAUTHORIZED_ACCESS_ATTEMPT', { error: 'Non-admin tried to access admin route' });
    return res.status(403).json({ msg: 'Access denied: Admins only' });
  }
  next();
}

// --- 2. AUDIT LOGGER (Activity Tracking) ---
// Usage: router.post('/books', auth, requireAdmin, audit('CREATE_BOOK'), ...)
function audit(actionName) {
  return async (req, res, next) => {
    // We hook into the response 'finish' event to log the outcome
    res.on('finish', async () => {
      // Only log if the request was authenticated (we need a user)
      // or if it was a critical failure we want to track anonymously
      if (req.user || res.statusCode >= 400) {
        try {
          await AuditLog.create({
            userId: req.user ? req.user.id : null,
            userName: req.user ? req.user.name : 'Anonymous',
            userRole: req.user ? req.user.role : 'Guest',
            action: actionName || `${req.method} ${req.baseUrl}${req.path}`,
            method: req.method,
            endpoint: req.originalUrl,
            // Be careful not to log sensitive data like passwords in req.body
            details: sanitizeBody(req.body), 
            ip: req.ip || req.connection.remoteAddress,
            status: res.statusCode
          });
        } catch (err) {
          console.error("Audit Log Error:", err);
        }
      }
    });
    next();
  };
}

// Helper to remove passwords from logs
function sanitizeBody(body) {
  if (!body) return {};
  const clean = { ...body };
  if (clean.password) clean.password = '[REDACTED]';
  if (clean.newPassword) clean.newPassword = '[REDACTED]';
  return clean;
}

// Manual helper for catching unauthorized attempts inside middleware
async function logAudit(req, action, details) {
  try {
    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown',
      userRole: req.user?.role || 'Guest',
      action,
      method: req.method,
      endpoint: req.originalUrl,
      details,
      ip: req.ip,
      status: 403
    });
  } catch(e) { console.error(e); }
}

module.exports = { requireAdmin, audit };