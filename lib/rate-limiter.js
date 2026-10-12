/**
 * In-memory sliding window rate limiter for brute-force protection
 */

const attemptsMap = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

function checkRateLimit(key) {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const minutesLeft = Math.ceil((record.lockedUntil - now) / (60 * 1000));
    return {
      allowed: false,
      locked: true,
      minutesLeft,
      message: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${minutesLeft} minute(s).`,
    };
  }

  // If lockout has expired, reset
  if (record.lockedUntil && record.lockedUntil <= now) {
    attemptsMap.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  // Check if window expired (15 mins from first attempt)
  if (now - record.firstAttemptAt > LOCKOUT_MS) {
    attemptsMap.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  return { allowed: record.count < MAX_ATTEMPTS, remaining };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record) {
    attemptsMap.set(key, {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    });
    return { remaining: MAX_ATTEMPTS - 1 };
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const minutesLeft = Math.ceil(LOCKOUT_MS / (60 * 1000));
    return {
      remaining: 0,
      locked: true,
      minutesLeft,
      message: `Too many failed attempts. Locked for ${minutesLeft} minutes.`,
    };
  }

  return { remaining: MAX_ATTEMPTS - record.count };
}

function resetRateLimit(key) {
  attemptsMap.delete(key);
}

module.exports = {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
};
