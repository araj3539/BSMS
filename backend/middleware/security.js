// backend/middleware/security.js
const AuditLog = require("../models/AuditLog");
const rateLimit = require("express-rate-limit");

// --- AUTH RATE LIMITER ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true, 
    legacyHeaders: false,

    // --- ADD THIS SECTION ---
    // This forces the limiter to use the specific 'x-forwarded-for' header
    // which contains the original Client IP, ignoring the load balancer's rotation.
    keyGenerator: (req, res) => {
        // If x-forwarded-for exists, split it by comma and take the first one (the real client).
        // If not, fall back to req.ip.
        if (req.headers['x-forwarded-for']) {
            return req.headers['x-forwarded-for'].split(',')[0];
        }
        return req.ip;
    },
    // ------------------------
    
    handler: (req, res, next, options) => {
        // Your custom error handler (if you have one)
        res.status(options.statusCode).json({
            success: false,
            message: "Too many login attempts. Please try again after 15 minutes."
        });
    }
});

// --- HELPER: Reset Limit for a Request ---
// usage: resetAuthLimit(req, res)
const resetAuthLimit = (req, res, next) => {
    // 1. Actually reset the internal counter for this IP address
    // This effectively sets their 'used' requests back to 0.
    if (authLimiter) {
        authLimiter.resetKey(req.ip);
    }

    // 2. Now manually set the header to tell the client they are full again
    // We hardcode '10' (or whatever your max is) because we just reset it.
    res.setHeader('RateLimit-Remaining', 10); 
    
    // 3. Continue
    if (next) next();
};

// --- 1. REQUIRE ADMIN (Authorization) ---
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ msg: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    logAudit(req, "UNAUTHORIZED_ACCESS_ATTEMPT", {
      error: "Non-admin tried to access admin route",
    });
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }
  next();
}

// --- 2. AUDIT LOGGER (Activity Tracking) ---
function audit(actionName) {
  return async (req, res, next) => {
    res.on("finish", async () => {
      if (req.user || res.statusCode >= 400) {
        try {
          await AuditLog.create({
            userId: req.user ? req.user.id : null,
            userName: req.user ? req.user.name : "Anonymous",
            userRole: req.user ? req.user.role : "Guest",
            action: actionName || `${req.method} ${req.baseUrl}${req.path}`,
            method: req.method,
            endpoint: req.originalUrl,
            details: sanitizeBody(req.body),
            ip: req.ip || req.connection.remoteAddress,
            status: res.statusCode,
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
  if (clean.password) clean.password = "[REDACTED]";
  if (clean.newPassword) clean.newPassword = "[REDACTED]";
  return clean;
}

// Manual helper for catching unauthorized attempts inside middleware
async function logAudit(req, action, details) {
  try {
    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name || "Unknown",
      userRole: req.user?.role || "Guest",
      action,
      method: req.method,
      endpoint: req.originalUrl,
      details,
      ip: req.ip,
      status: 403,
    });
  } catch (e) {
    console.error(e);
  }
}

module.exports = { requireAdmin, audit, authLimiter, resetAuthLimit };
