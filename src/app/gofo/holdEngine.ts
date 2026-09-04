/**
 * Concurrency Slot Hold Engine (10-Minute Hold TTL with Race-Condition Elimination)
 */

import { BookingHold, BookingHoldStatus } from './types';

export class SlotHoldEngine {
  private static holds = new Map<string, BookingHold>();

  /**
   * Sweeper to release any expired holds older than 10 minutes
   */
  static cleanExpiredHolds(): void {
    const now = new Date().toISOString();
    for (const [id, hold] of this.holds.entries()) {
      if (hold.status === 'HELD' && hold.expiresAt <= now) {
        hold.status = 'EXPIRED';
        this.holds.set(id, hold);
      }
    }
  }

  /**
   * Check if a resource is currently held or has an active hold
   */
  static isSlotHeld(tenantId: string, resourceId: string, startAt: string, endAt: string): boolean {
    this.cleanExpiredHolds();
    const reqStart = new Date(startAt).getTime();
    const reqEnd = new Date(endAt).getTime();

    for (const hold of this.holds.values()) {
      if (hold.tenantId === tenantId && hold.resourceId === resourceId && hold.status === 'HELD') {
        const hStart = new Date(hold.startAt).getTime();
        const hEnd = new Date(hold.endAt).getTime();

        // Check time overlap: (StartA < EndB) and (EndA > StartB)
        if (reqStart < hEnd && reqEnd > hStart) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Acquire a temporary 10-minute hold on a slot during checkout
   */
  static acquireHold(
    tenantId: string,
    resourceId: string,
    startAt: string,
    endAt: string,
    sessionId: string,
    customerPhone: string,
    ttlMinutes: number = 10
  ): { success: boolean; hold?: BookingHold; error?: string } {
    this.cleanExpiredHolds();

    if (this.isSlotHeld(tenantId, resourceId, startAt, endAt)) {
      return {
        success: false,
        error: 'This slot is currently being held by another guest. Please choose another time slot.'
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();

    const hold: BookingHold = {
      id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      resourceId,
      startAt,
      endAt,
      sessionId,
      customerPhone,
      expiresAt,
      status: 'HELD',
      createdAt: now.toISOString(),
    };

    this.holds.set(hold.id, hold);
    return { success: true, hold };
  }

  /**
   * Convert an active hold into a confirmed booking
   */
  static convertHold(holdId: string): boolean {
    const hold = this.holds.get(holdId);
    if (!hold || hold.status !== 'HELD') return false;
    hold.status = 'CONVERTED';
    this.holds.set(holdId, hold);
    return true;
  }

  /**
   * Release hold manually if customer cancels checkout
   */
  static releaseHold(holdId: string): void {
    const hold = this.holds.get(holdId);
    if (hold && hold.status === 'HELD') {
      hold.status = 'RELEASED';
      this.holds.set(holdId, hold);
    }
  }
}
