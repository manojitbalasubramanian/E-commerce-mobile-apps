const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constants');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

async function checkRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied. Required role: ' + roles.join(' or ') });
      }
      
      req.user = user;
      next();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}

module.exports = { verifyToken, checkRole };
