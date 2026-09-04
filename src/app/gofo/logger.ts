/**
 * Enterprise Production Structured Logger with PII & Secret Redaction
 * 
 * Guarantees:
 * - ISO-8601 timestamps
 * - Log levels: INFO, WARN, ERROR, AUDIT
 * - Automatic masking of phone numbers, emails, passwords, OTPs, private keys, auth headers
 * - Webhook & payment failure visibility
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  context?: Record<string, any>;
  error?: string;
  stack?: string;
}

export class ProductionLogger {
  private static sensitiveKeys = new Set([
    'password',
    'passcode',
    'admin_passcode',
    'otp',
    'code',
    'secret',
    'privatekey',
    'private_key',
    'token',
    'authorization',
    'x-admin-passcode',
    'webhooksecret',
    'keyid',
  ]);

  /**
   * Masks sensitive PII and credentials recursively
   */
  static maskSensitiveData(data: any): any {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
      // Mask phone numbers (e.g., +919900106474 -> +9199****6474 or 9900106474 -> 9900****74)
      let sanitized = data.replace(/(\+?\d{2,4})?(\d{2})(\d{4,6})(\d{2})/, (match, p1, p2, p3, p4) => {
        return `${p1 || ''}${p2}${'*'.repeat(p3.length)}${p4}`;
      });

      // Mask email addresses (e.g., admin@beevibe.org -> a***@beevibe.org)
      sanitized = sanitized.replace(/([a-zA-Z0-9_\.-])[a-zA-Z0-9_\.-]*@([a-zA-Z0-9_\.-]+\.[a-zA-Z]{2,})/g, '$1***@$2');

      // Mask private key blocks
      sanitized = sanitized.replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[^-]+-----END [A-Z ]+ PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');

      return sanitized;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (this.sensitiveKeys.has(lowerKey)) {
          result[key] = '[REDACTED]';
        } else if (lowerKey.includes('secret') || lowerKey.includes('pass') || lowerKey.includes('token') || lowerKey.includes('key')) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = this.maskSensitiveData(value);
        }
      }
      return result;
    }

    return data;
  }

  static formatLog(level: LogLevel, event: string, context?: Record<string, any>, error?: Error): string {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      context: context ? this.maskSensitiveData(context) : undefined,
    };

    if (error) {
      entry.error = error.message;
      if (level === 'ERROR' && process.env.NODE_ENV !== 'production') {
        entry.stack = error.stack;
      }
    }

    return JSON.stringify(entry);
  }

  static info(event: string, context?: Record<string, any>): void {
    console.log(this.formatLog('INFO', event, context));
  }

  static warn(event: string, context?: Record<string, any>, error?: Error): void {
    console.warn(this.formatLog('WARN', event, context, error));
  }

  static error(event: string, context?: Record<string, any>, error?: Error): void {
    console.error(this.formatLog('ERROR', event, context, error));
  }

  static audit(event: string, context?: Record<string, any>): void {
    console.log(this.formatLog('AUDIT', event, context));
  }
}
