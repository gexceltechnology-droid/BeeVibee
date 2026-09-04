/**
 * Distributed / Shared-State Rate Limiter
 * 
 * Supports sliding window rate limiting backed by persistent shared database storage.
 * In production (NODE_ENV === 'production'), strictly mandates persistent shared state
 * to prevent multi-instance / serverless rate-limit bypasses.
 */

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds?: number;
}

// Persistent / Shared Store Interface
export interface ISharedRateLimitStore {
  getTimestamps(key: string, cutoffMs: number): Promise<number[]>;
  recordTimestamp(key: string, timestamp: number, ttlSeconds: number): Promise<number[]>;
}

// Memory-backed local cache (Only permitted during local dev / test runs)
interface RateLimitRecord {
  timestamps: number[];
}
const localCache = new Map<string, RateLimitRecord>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  sharedStore?: ISharedRateLimitStore
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Shared Persistent Store Path
  if (sharedStore) {
    try {
      const timestamps = await sharedStore.recordTimestamp(key, now, windowSeconds);
      const activeTimestamps = timestamps.filter((ts) => ts > cutoff);

      if (activeTimestamps.length > limit) {
        const oldest = activeTimestamps[0];
        const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        return {
          allowed: false,
          current: activeTimestamps.length,
          limit,
          remaining: 0,
          resetSeconds,
          retryAfterSeconds: resetSeconds,
        };
      }

      return {
        allowed: true,
        current: activeTimestamps.length,
        limit,
        remaining: Math.max(0, limit - activeTimestamps.length),
        resetSeconds: windowSeconds,
      };
    } catch (err: any) {
      if (isProduction) {
        throw new Error(`[CRITICAL] Shared persistent rate limiter unreachable in production: ${err.message}`);
      }
    }
  }

  // 2. Production Strictness Invariant: Refuse in-memory bypass in production if shared store is missing
  if (isProduction && !sharedStore) {
    throw new Error('[CRITICAL] Rate limiting in production requires shared persistent store (PostgreSQL/Firestore). In-memory state is forbidden.');
  }

  // 3. Dev / Testing Fast-Path Memory Store
  let record = localCache.get(key);
  if (!record) {
    record = { timestamps: [] };
    localCache.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      current: record.timestamps.length,
      limit,
      remaining: 0,
      resetSeconds,
      retryAfterSeconds: resetSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    current: record.timestamps.length,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetSeconds: windowSeconds,
  };
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
