/**
 * Enterprise Multi-Tenant Hospitality & Booking SaaS Core Types
 */

export type Currency = 'INR' | 'USD' | 'EUR';
export type BusinessCategory = 'THEATER_GAMING' | 'ESCAPE_ROOM' | 'EVENT_SPACE' | 'SALON' | 'CAFE';

export interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
}

export interface Tenant {
  id: string; // UUID
  slug: string;
  businessName: string;
  legalEntityName?: string;
  businessCategory: BusinessCategory;
  contactPhone: string;
  contactEmail: string;
  currency: Currency;
  timezone: string; // e.g. "Asia/Kolkata"
  branding: TenantBranding;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType = 'THEATER_ROOM' | 'GAMING_STATION' | 'COURT' | 'TABLE' | 'STUDIO';

export interface Resource {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  resourceType: ResourceType;
  capacity: number;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  durationMinutes: number;
  advanceAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityRule {
  id: string;
  tenantId: string;
  resourceId: string;
  dayOfWeek: number; // 0 - 6
  openTime: string; // "10:00"
  closeTime: string; // "00:00"
  slotDurationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
}

// ----------------------------------------------------------------------------
// CONCURRENCY & BOOKING ENGINE
// ----------------------------------------------------------------------------

export type BookingHoldStatus = 'HELD' | 'CONVERTED' | 'EXPIRED' | 'RELEASED';

export interface BookingHold {
  id: string;
  tenantId: string;
  resourceId: string;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  sessionId: string;
  customerPhone: string;
  expiresAt: string; // 10 minute TTL
  status: BookingHoldStatus;
  createdAt: string;
}

export type BookingStatus = 
  | 'DRAFT' 
  | 'HELD' 
  | 'PAYMENT_PENDING' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'EXPIRED';

export type BookingFinancialStatus = 
  | 'UNPAID' 
  | 'PARTIALLY_PAID' 
  | 'ADVANCE_PAID' 
  | 'FULLY_PAID' 
  | 'PARTIALLY_REFUNDED' 
  | 'REFUNDED';

export interface BookingAddonItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  tenantId: string;
  locationId: string;
  resourceId: string;
  serviceId: string;
  customerId: string;
  referenceCode: string; // e.g. "BV-2026-X9Y2"
  startAt: string;
  endAt: string;
  guestCount: number;
  basePrice: number;
  addonsTotal: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: BookingFinancialStatus;
  specialRequests?: string;
  addons?: BookingAddonItem[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// PAYMENT ENGINE & ROUTER
// ----------------------------------------------------------------------------

export type PaymentProvider = 'MANUAL_UPI' | 'RAZORPAY' | 'CASHFREE' | 'DECENTRO' | 'DIRECT_BANK';
export type PaymentCapability = 'UPI' | 'CARD' | 'NETBANKING' | 'REFUND';
export type ConfirmationPolicy = 'AUTHORITATIVE_WEBHOOK' | 'BANK_RECONCILIATION' | 'ADMIN_VERIFICATION' | 'MANUAL_OVERRIDE';

export interface TenantPaymentAccount {
  id: string;
  tenantId: string;
  provider: PaymentProvider;
  providerAccountId?: string;
  capabilities: PaymentCapability[];
  credentialReference?: string; // e.g. "secret://tenants/123/razorpay"
  configuration: {
    payeeName?: string;
    upiId?: string;
    bankName?: string;
    qrImageUrl?: string;
    [key: string]: any;
  };
  confirmationPolicy: ConfirmationPolicy;
  priority: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentOrderPurpose = 'BOOKING_ADVANCE' | 'VENUE_BALANCE' | 'FOOD_ORDER' | 'CANCELLATION_FEE';
export type PaymentOrderStatus = 
  | 'CREATED' 
  | 'INITIATED' 
  | 'PENDING' 
  | 'VERIFYING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'EXPIRED' 
  | 'REFUNDED' 
  | 'DISPUTED';

export interface PaymentOrder {
  id: string;
  tenantId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  currency: Currency;
  purpose: PaymentOrderPurpose;
  status: PaymentOrderStatus;
  merchantReference: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentTransactionStatus = 
  | 'INITIATED' 
  | 'PENDING_VERIFICATION' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'EXPIRED' 
  | 'DISPUTED';

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  paymentOrderId: string;
  tenantPaymentAccountId: string;
  provider: PaymentProvider;
  providerTransactionId?: string;
  bankReference?: string; // UTR or Bank Txn ID
  amount: number;
  currency: Currency;
  status: PaymentTransactionStatus;
  rawProviderData?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReconciliationStatus = 'MATCHED' | 'MISMATCH_FLAGGED' | 'RECONCILED';

export interface ReconciliationLog {
  id: string;
  tenantId: string;
  paymentTransactionId: string;
  verifiedByUserId?: string;
  verificationMethod: 'WEBHOOK' | 'ADMIN_MANUAL' | 'BANK_FEED_MATCH' | 'MANUAL_OVERRIDE';
  status: ReconciliationStatus;
  bankStatementLineId?: string;
  notes?: string;
  reconciledAt: string;
}

export interface VenueSettlement {
  id: string;
  tenantId: string;
  bookingId: string;
  collectedByUserId: string;
  amountCollected: number;
  paymentMode: 'CASH' | 'UPI_DESK' | 'CARD_POS';
  settlementNotes?: string;
  settledAt: string;
}

// ----------------------------------------------------------------------------
// CRM, GUEST INTELLIGENCE & MARKETING
// ----------------------------------------------------------------------------

export interface Customer {
  id: string;
  tenantId: string;
  phone: string;
  name: string;
  email?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerMetrics {
  customerId: string;
  tenantId: string;
  totalBookings: number;
  completedBookings: number;
  lifetimeSpend: number; // Gross INR
  firstVisitAt?: string;
  lastVisitAt?: string;
  favoriteResourceId?: string;
  rfmScore: number;
  calculatedSegment: string; // 'VIP' | 'REGULAR' | 'GAMER' | 'NEW'
  calculatedAt: string;
}

export interface CustomerNote {
  id: string;
  tenantId: string;
  customerId: string;
  authorUserId: string;
  note: string;
  createdAt: string;
}

export interface CrmSegmentRule {
  id: string;
  tenantId: string;
  segmentName: string;
  conditions: {
    lifetimeSpend?: { gte?: number; lte?: number };
    completedBookings?: { gte?: number; lte?: number };
    daysSinceLastVisit?: { gte?: number; lte?: number };
    [key: string]: any;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export type AutomationTrigger = 
  | 'BOOKING_COMPLETED' 
  | 'CUSTOMER_INACTIVE_60D' 
  | 'BIRTHDAY' 
  | 'ANNIVERSARY' 
  | 'PAYMENT_RECEIVED';

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  triggerEvent: AutomationTrigger;
  conditions: Record<string, any>;
  delayMinutes: number;
  actionType: 'SEND_WHATSAPP' | 'SEND_SMS' | 'SEND_EMAIL';
  templateBody: string;
  isActive: boolean;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// PLATFORM SAAS SUBSCRIPTIONS & OUTBOX
// ----------------------------------------------------------------------------

export interface Plan {
  id: string;
  code: 'STARTER' | 'PRO' | 'ENTERPRISE';
  name: string;
  priceMonthly: number;
  features: {
    maxLocations: number;
    maxStaff: number;
    whatsappAutomations: boolean;
    customDomain: boolean;
    analytics: boolean;
    [key: string]: any;
  };
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxEvent {
  id: string;
  tenantId: string;
  aggregateType: 'BOOKING' | 'PAYMENT' | 'CUSTOMER' | 'WEBHOOK';
  aggregateId: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
}
