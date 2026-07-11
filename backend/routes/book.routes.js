import express from 'express';
import { getRecommendations } from '../controllers/recommendation.controller.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Optional Auth Middleware: Attaches req.user if token is valid, but doesn't block if missing
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Assuming your JWT payload contains the user object/ID
    } catch (err) {
      console.warn("Invalid token in optional auth, proceeding as guest.");
    }
  }
  next();
};

// Apply optionalAuth to the recommendations route
router.get('/:id/recommendations', optionalAuth, getRecommendations);

export default router;