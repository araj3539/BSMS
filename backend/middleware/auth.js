// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';

function auth(req, res, next){
  const header = req.headers.authorization;
  if(!header || !header.startsWith('Bearer ')) return res.status(401).json({ msg: 'No token provided' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch(err){
    return res.status(401).json({ msg: 'Invalid token' });
  }
}

function isAdmin(req, res, next){
  if(!req.user) return res.status(401).json({ msg: 'Not authenticated' });
  if(req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin only' });
  next();
}

module.exports = { auth, isAdmin };
