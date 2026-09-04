/**
 * Multi-Tenant Manager & Flagship Tenant Registry
 */

import { Tenant, Location, Resource, Service, TenantPaymentAccount } from './types';

export const FLAGSHIP_BEE_VIBE_TENANT: Tenant = {
  id: 'tenant_beevibe',
  slug: 'beevibe',
  businessName: 'Bee Vibe Private Celebration Theater & Gaming Lounge',
  legalEntityName: 'Bee Vibe Bangalore LLP',
  businessCategory: 'THEATER_GAMING',
  contactPhone: '+919900106474',
  contactEmail: 'admin@beevibe.org',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  branding: {
    primaryColor: '#ff0055',
    accentColor: '#00f0ff',
    logoUrl: '/icon.png',
  },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-09-04T00:00:00.000Z',
};

export const FLAGSHIP_LOCATIONS: Location[] = [
  {
    id: 'loc_beevibe_bangalore',
    tenantId: 'tenant_beevibe',
    name: 'Bee Vibe Bangalore (Main Hub)',
    slug: 'bangalore-main',
    addressLine1: 'Hennur Main Road, HRBR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560043',
    contactPhone: '+919900106474',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  }
];

export const FLAGSHIP_RESOURCES: Resource[] = [
  {
    id: 'res_red_room',
    tenantId: 'tenant_beevibe',
    locationId: 'loc_beevibe_bangalore',
    name: 'Red Velvet Romance Room',
    resourceType: 'THEATER_ROOM',
    capacity: 10,
    isActive: true,
    metadata: { color: 'red', themeCode: 'RED_VELVET', defaultPrice: 799 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'res_pink_room',
    tenantId: 'tenant_beevibe',
    locationId: 'loc_beevibe_bangalore',
    name: 'Rose Pink Angel Wings Room',
    resourceType: 'THEATER_ROOM',
    capacity: 10,
    isActive: true,
    metadata: { color: 'pink', themeCode: 'ANGEL_WINGS', defaultPrice: 899 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'res_purple_room',
    tenantId: 'tenant_beevibe',
    locationId: 'loc_beevibe_bangalore',
    name: 'Royal Butterfly Purple Room',
    resourceType: 'THEATER_ROOM',
    capacity: 10,
    isActive: true,
    metadata: { color: 'purple', themeCode: 'ROYAL_BUTTERFLY', defaultPrice: 999 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'res_gaming_room',
    tenantId: 'tenant_beevibe',
    locationId: 'loc_beevibe_bangalore',
    name: 'PS5 Dark Knight Gaming Lounge',
    resourceType: 'GAMING_STATION',
    capacity: 6,
    metadata: { color: 'cyan', themeCode: 'PS5_GAMING', hourlyRate: 399 },
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  }
];

export const FLAGSHIP_SERVICES: Service[] = [
  {
    id: 'srv_red_theme',
    tenantId: 'tenant_beevibe',
    name: 'Red Theme (Red Velvet Romance)',
    slug: 'red-theme',
    description: 'Intimate crimson roses and velvet ambiance for couples & birthdays.',
    basePrice: 799,
    durationMinutes: 120,
    advanceAmount: 500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'srv_pink_theme',
    tenantId: 'tenant_beevibe',
    name: 'Pink Theme (Angel Wings & Neon)',
    slug: 'pink-theme',
    description: 'Vibrant neon fairy aesthetics and glowing photo backdrops.',
    basePrice: 899,
    durationMinutes: 120,
    advanceAmount: 500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'srv_purple_theme',
    tenantId: 'tenant_beevibe',
    name: 'Purple Theme (Royal Butterfly Grandeur)',
    slug: 'purple-theme',
    description: 'Lavish royal purple butterfly decor and luxury theater seating.',
    basePrice: 999,
    durationMinutes: 120,
    advanceAmount: 500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'srv_gaming_lounge',
    tenantId: 'tenant_beevibe',
    name: 'PS5 Gaming Lounge Experience',
    slug: 'gaming-lounge',
    description: '4K 120Hz gaming with dual PS5 controllers and top multiplayer titles.',
    basePrice: 399,
    durationMinutes: 60,
    advanceAmount: 399,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  }
];

export const FLAGSHIP_PAYMENT_ACCOUNTS: TenantPaymentAccount[] = [
  {
    id: 'acc_beevibe_sbi_upi',
    tenantId: 'tenant_beevibe',
    provider: 'MANUAL_UPI',
    capabilities: ['UPI'],
    configuration: {
      payeeName: 'NALINAKSHI C',
      upiId: '8123635342@sbi',
      bankName: 'STATE BANK OF INDIA 6592',
      qrImageUrl: '/beevibe-payment-qr.jpg',
    },
    confirmationPolicy: 'BANK_RECONCILIATION',
    priority: 1,
    isEnabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  }
];

export class TenantManager {
  private static tenantsMap = new Map<string, Tenant>([
    [FLAGSHIP_BEE_VIBE_TENANT.id, FLAGSHIP_BEE_VIBE_TENANT]
  ]);

  static getTenant(tenantId: string = 'tenant_beevibe'): Tenant {
    const tenant = this.tenantsMap.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found for ID: ${tenantId}`);
    }
    return tenant;
  }

  static getPaymentAccounts(tenantId: string = 'tenant_beevibe'): TenantPaymentAccount[] {
    if (tenantId === 'tenant_beevibe') {
      return FLAGSHIP_PAYMENT_ACCOUNTS.filter(a => a.isEnabled);
    }
    return [];
  }

  static getResources(tenantId: string = 'tenant_beevibe'): Resource[] {
    if (tenantId === 'tenant_beevibe') {
      return FLAGSHIP_RESOURCES.filter(r => r.isActive);
    }
    return [];
  }

  static getServices(tenantId: string = 'tenant_beevibe'): Service[] {
    if (tenantId === 'tenant_beevibe') {
      return FLAGSHIP_SERVICES.filter(s => s.isActive);
    }
    return [];
  }
}
