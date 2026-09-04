/**
 * Safe, Bounded Health Diagnostics
 * 
 * Guarantees:
 * - Public endpoint returns ONLY bounded, safe metadata: status, timestamp, uptime, database: ok/degraded, version.
 * - Zero exposure of hostnames, connection strings, error stack traces, internal IPs.
 * - Throttled DB ping with 10-second cooldown cache to prevent DB connection pool exhaustion / amplification attacks.
 */

export interface PublicHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  database: 'ok' | 'degraded' | 'unavailable';
  version: string;
}

export interface InternalDiagnostics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: 'ok' | 'degraded' | 'unavailable';
    latencyMs?: number;
    error?: string;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  environment: {
    nodeEnv: string;
    configuredServices: string[];
  };
}

let lastDbCheckTime = 0;
let lastDbStatus: 'ok' | 'degraded' | 'unavailable' = 'ok';
let lastDbLatencyMs = 0;
const DB_CHECK_COOLDOWN_MS = 10000; // 10s cooldown cache

const processStartTime = Date.now();

export class HealthService {
  /**
   * Safe public health check (No secrets, no stack traces, no internal IPs)
   */
  static async getPublicHealth(dbPingFn?: () => Promise<boolean>): Promise<PublicHealthStatus> {
    const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);
    const dbStatus = await this.checkDbHealth(dbPingFn);

    const overallStatus = dbStatus === 'ok' ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      database: dbStatus,
      version: '1.0.0',
    };
  }

  /**
   * Internal telemetry for authenticated admin logging
   */
  static async getInternalDiagnostics(dbPingFn?: () => Promise<boolean>): Promise<InternalDiagnostics> {
    const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);
    const dbStatus = await this.checkDbHealth(dbPingFn);

    const mem = process.memoryUsage();

    const configuredServices: string[] = [];
    if (process.env.ADMIN_PASSCODE) configuredServices.push('ADMIN_AUTH');
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) configuredServices.push('FIREBASE');
    if (process.env.TWILIO_ACCOUNT_SID) configuredServices.push('TWILIO');
    if (process.env.META_WHATSAPP_TOKEN) configuredServices.push('WHATSAPP');

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      database: {
        status: dbStatus,
        latencyMs: lastDbLatencyMs,
      },
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        configuredServices,
      },
    };
  }

  private static async checkDbHealth(dbPingFn?: () => Promise<boolean>): Promise<'ok' | 'degraded' | 'unavailable'> {
    const now = Date.now();
    if (now - lastDbCheckTime < DB_CHECK_COOLDOWN_MS) {
      return lastDbStatus;
    }

    lastDbCheckTime = now;
    const start = Date.now();

    if (!dbPingFn) {
      lastDbLatencyMs = 1;
      lastDbStatus = 'ok';
      return 'ok';
    }

    try {
      const isAlive = await dbPingFn();
      lastDbLatencyMs = Date.now() - start;
      lastDbStatus = isAlive ? 'ok' : 'degraded';
      return lastDbStatus;
    } catch (e) {
      lastDbLatencyMs = Date.now() - start;
      lastDbStatus = 'unavailable';
      return 'unavailable';
    }
  }
}
