const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const AUTH_COOKIE_NAME = 'blood_donation_session';
const DEFAULT_AUTH_SECRET = 'dev_blood_donation_secret_key_change_in_production_32chars';

function getAuthSecret() {
  return process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}

/**
 * Compare plain password against bcrypt hash
 */
async function comparePassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}

/**
 * Issue a signed JWT token
 */
function signToken(payload, expiresIn = '8h') {
  return jwt.sign(payload, getAuthSecret(), { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, getAuthSecret());
  } catch (err) {
    return null;
  }
}

/**
 * Extract token from Request headers or cookies
 */
function extractTokenFromRequest(req) {
  // If next/headers or NextRequest cookies
  if (req && req.cookies && typeof req.cookies.get === 'function') {
    const cookie = req.cookies.get(AUTH_COOKIE_NAME);
    if (cookie) return cookie.value;
  }

  // Parse Cookie header manually if req.headers
  const cookieHeader = req?.headers?.get ? req.headers.get('cookie') : req?.headers?.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, pair) => {
      const [k, v] = pair.trim().split('=');
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    if (cookies[AUTH_COOKIE_NAME]) return cookies[AUTH_COOKIE_NAME];
  }

  // Check Bearer authorization header as alternative
  const authHeader = req?.headers?.get ? req.headers.get('authorization') : req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Authenticate session from request
 */
async function authenticateRequest(req) {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return { authenticated: false, error: 'No session token provided' };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.adminId) {
    return { authenticated: false, error: 'Invalid or expired session token' };
  }

  return {
    authenticated: true,
    user: {
      adminId: decoded.adminId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role, // 'owner' | 'admin'
    },
  };
}

module.exports = {
  AUTH_COOKIE_NAME,
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  extractTokenFromRequest,
  authenticateRequest,
};
