import { NextRequest } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000); // 1 hour
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * Extract client IP address safely from NextRequest
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * Check sliding window rate limit for an action
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetSeconds: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the active window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      retryAfterSeconds: resetSeconds,
    };
  }

  // Record this attempt
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetSeconds: windowSeconds,
    retryAfterSeconds: 0,
  };
}
