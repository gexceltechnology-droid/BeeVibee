/**
 * Multi-Tenant CRM & Guest Intelligence Engine
 */

import { Customer, CustomerMetrics, CustomerNote } from './types';

export interface AggregatedCustomerProfile extends Customer {
  metrics: CustomerMetrics;
  notes: CustomerNote[];
  bookingHistory: any[];
  foodOrderHistory: any[];
}

interface CustomerAccumulator {
  name: string;
  email?: string;
  phone: string;
  bookings: any[];
  foodOrders: any[];
  firstVisit: string;
  lastVisit: string;
  totalSpend: number;
  favoriteThemeMap: Map<string, number>;
  gamingVisits: number;
}

export class CrmEngine {
  private static customerNotes = new Map<string, CustomerNote[]>(); // key: `${tenantId}:${phone}`

  /**
   * Aggregate bookings and food orders into rich customer profiles
   */
  static aggregateCustomerProfiles(
    tenantId: string,
    bookings: any[] = [],
    foodOrders: any[] = []
  ): AggregatedCustomerProfile[] {
    const customerMap = new Map<string, CustomerAccumulator>();

    // Process Bookings
    for (const b of bookings) {
      if (!b.phone) continue;
      const cleanPhone = b.phone.trim();
      const existing: CustomerAccumulator = customerMap.get(cleanPhone) || {
        name: b.customerName || 'Guest',
        email: b.email,
        phone: cleanPhone,
        bookings: [] as any[],
        foodOrders: [] as any[],
        firstVisit: b.date || b.createdAt || '',
        lastVisit: b.date || b.createdAt || '',
        totalSpend: 0,
        favoriteThemeMap: new Map<string, number>(),
        gamingVisits: 0,
      };

      existing.bookings.push(b);
      if (b.status === 'confirmed' || b.status === 'completed') {
        existing.totalSpend += Number(b.totalPrice || 0);
      }

      if (b.date && (existing.lastVisit < b.date)) {
        existing.lastVisit = b.date;
      }
      if (b.date && (!existing.firstVisit || existing.firstVisit > b.date)) {
        existing.firstVisit = b.date;
      }

      const isGaming = b.bookingType === 'gaming' || (b.packageName && b.packageName.includes('Gaming'));
      if (isGaming) {
        existing.gamingVisits += 1;
      } else if (b.packageName) {
        const theme = b.packageName;
        existing.favoriteThemeMap.set(theme, (existing.favoriteThemeMap.get(theme) || 0) + 1);
      }

      customerMap.set(cleanPhone, existing);
    }

    // Process Food Orders
    for (const o of foodOrders) {
      if (!o.phone) continue;
      const cleanPhone = o.phone.trim();
      const existing = customerMap.get(cleanPhone);
      if (existing) {
        existing.foodOrders.push(o);
        if (o.status === 'served') {
          existing.totalSpend += Number(o.totalPrice || 0);
        }
      }
    }

    // Build Profiles with Calculated Metrics
    const now = new Date();
    const profiles: AggregatedCustomerProfile[] = [];

    for (const [phone, data] of customerMap.entries()) {
      let favoriteTheme = 'Red Velvet Romance';
      let maxCount = 0;
      for (const [theme, count] of data.favoriteThemeMap.entries()) {
        if (count > maxCount) {
          maxCount = count;
          favoriteTheme = theme;
        }
      }
      if (data.gamingVisits > maxCount) {
        favoriteTheme = 'PS5 Gaming Lounge';
      }

      const totalBookings = data.bookings.length;
      const completedBookings = data.bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;

      // Dynamic Tier Calculation
      let calculatedSegment = 'NEW';
      if (data.totalSpend >= 2500 || totalBookings >= 3) {
        calculatedSegment = 'VIP';
      } else if (totalBookings >= 2) {
        calculatedSegment = 'REGULAR';
      } else if (data.gamingVisits > 0) {
        calculatedSegment = 'GAMER';
      }

      const notes = this.customerNotes.get(`${tenantId}:${phone}`) || [];

      profiles.push({
        id: `cust_${phone.replace(/\D/g, '')}`,
        tenantId,
        phone,
        name: data.name,
        email: data.email,
        createdAt: data.firstVisit || now.toISOString(),
        updatedAt: data.lastVisit || now.toISOString(),
        metrics: {
          customerId: `cust_${phone.replace(/\D/g, '')}`,
          tenantId,
          totalBookings,
          completedBookings,
          lifetimeSpend: data.totalSpend,
          firstVisitAt: data.firstVisit,
          lastVisitAt: data.lastVisit,
          rfmScore: Math.min(100, (completedBookings * 20) + Math.floor(data.totalSpend / 100)),
          calculatedSegment,
          calculatedAt: now.toISOString(),
        },
        notes,
        bookingHistory: data.bookings,
        foodOrderHistory: data.foodOrders,
      });
    }

    // Sort by Lifetime Spend (descending)
    return profiles.sort((a, b) => b.metrics.lifetimeSpend - a.metrics.lifetimeSpend);
  }

  /**
   * Add a private staff CRM note for a guest
   */
  static addCustomerNote(tenantId: string, phone: string, author: string, noteText: string): CustomerNote {
    const key = `${tenantId}:${phone.trim()}`;
    const existing = this.customerNotes.get(key) || [];
    const note: CustomerNote = {
      id: `note_${Date.now()}`,
      tenantId,
      customerId: `cust_${phone.replace(/\D/g, '')}`,
      authorUserId: author,
      note: noteText,
      createdAt: new Date().toISOString(),
    };

    existing.unshift(note);
    this.customerNotes.set(key, existing);
    return note;
  }
}
