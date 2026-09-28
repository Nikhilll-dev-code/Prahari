const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const config = require('./config');

// In-memory failed attempt tracker { username: { count: number, lockedUntil: timestamp } }
const failedAttempts = new Map();

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      name: user.name,
      role: user.role,
      installation: user.installation
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY }
  );
}

// Authentication Controller
function login(username, password) {
  const normUser = (username || '').trim().toLowerCase();
  const now = Date.now();

  // Check account lockout (FR-4.4)
  const attemptInfo = failedAttempts.get(normUser);
  if (attemptInfo && attemptInfo.lockedUntil && attemptInfo.lockedUntil > now) {
    const remainingMins = Math.ceil((attemptInfo.lockedUntil - now) / 60000);
    return {
      success: false,
      status: 403,
      error: `Account is temporarily locked due to 5 consecutive failed attempts. Try again in ${remainingMins} minute(s).`
    };
  }

  const user = db.getUserByUsername(normUser);
  // AUTH-1: Don't reveal whether username or password was incorrect
  if (!user || !verifyPassword(password, user.password_hash)) {
    const current = attemptInfo || { count: 0, lockedUntil: null };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + (15 * 60 * 1000); // 15 mins lockout
      failedAttempts.set(normUser, current);
      return {
        success: false,
        status: 403,
        error: 'Account locked for 15 minutes after 5 consecutive failed login attempts.'
      };
    }
    failedAttempts.set(normUser, current);
    return {
      success: false,
      status: 401,
      error: 'Invalid username or password.'
    };
  }

  // Clear failed attempts on success
  failedAttempts.delete(normUser);

  const token = generateToken(user);
  return {
    success: true,
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      name: user.name,
      role: user.role,
      installation: user.installation
    }
  };
}

// Middleware: Authenticate JWT
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

// Middleware: Authorize Roles
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // ERR-4: Generic 403 response
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  login,
  requireAuth,
  requireRoles
};
