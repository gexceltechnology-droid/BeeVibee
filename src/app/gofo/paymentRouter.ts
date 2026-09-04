/**
 * Provider-Agnostic Payment Router & Adapters
 */

import { 
  TenantPaymentAccount, 
  PaymentOrder, 
  PaymentTransaction, 
  Currency, 
  PaymentProvider 
} from './types';

export class UnsupportedPaymentProviderError extends Error {
  constructor(provider: string) {
    super(`Unsupported or unconfigured payment provider: ${provider}`);
    this.name = 'UnsupportedPaymentProviderError';
  }
}

export interface CreatePaymentInput {
  tenantId: string;
  paymentOrderId: string;
  amount: number;
  currency: Currency;
  method: 'UPI' | 'CARD' | 'NETBANKING';
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  purpose: string;
}

export interface ProviderPaymentOrder {
  providerTransactionId: string;
  provider: PaymentProvider;
  paymentIntentUrl?: string;
  qrCodeUrl?: string;
  payeeDetails?: {
    name: string;
    upiId: string;
    bankName: string;
  };
  checkoutPayload?: Record<string, any>;
  expiresAt: string;
}

export interface CanonicalPaymentStatus {
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'DISPUTED';
  bankReference?: string;
  amount: number;
  rawResponse: Record<string, any>;
}

export interface CanonicalPaymentEvent {
  eventType: 'PAYMENT_CAPTURED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED';
  merchantReference: string;
  providerTransactionId: string;
  bankReference?: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  rawPayload: Record<string, any>;
}

export interface IPaymentProviderAdapter {
  readonly providerName: PaymentProvider;
  createOrder(input: CreatePaymentInput): Promise<ProviderPaymentOrder>;
  queryStatus(providerTransactionId: string): Promise<CanonicalPaymentStatus>;
  parseWebhook(headers: Record<string, string>, rawBody: string): Promise<CanonicalPaymentEvent>;
}

/**
 * Manual UPI Adapter (Flagship for Bee Vibe SBI Account)
 */
export class ManualUpiAdapter implements IPaymentProviderAdapter {
  readonly providerName: PaymentProvider = 'MANUAL_UPI';

  constructor(private account: TenantPaymentAccount) {}

  async createOrder(input: CreatePaymentInput): Promise<ProviderPaymentOrder> {
    const payeeName = this.account.configuration.payeeName || 'NALINAKSHI C';
    const upiId = this.account.configuration.upiId || '8123635342@sbi';
    const bankName = this.account.configuration.bankName || 'STATE BANK OF INDIA 6592';
    const qrImageUrl = this.account.configuration.qrImageUrl || '/beevibe-payment-qr.jpg';

    const providerTransactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const note = encodeURIComponent(`Advance Booking Deposit`);
    const pn = encodeURIComponent(payeeName);
    const paymentIntentUrl = `upi://pay?pa=${upiId}&pn=${pn}&am=${input.amount}&tn=${note}&tr=${providerTransactionId}&cu=INR`;

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    return {
      providerTransactionId,
      provider: 'MANUAL_UPI',
      paymentIntentUrl,
      qrCodeUrl: qrImageUrl,
      payeeDetails: {
        name: payeeName,
        upiId,
        bankName,
      },
      expiresAt,
    };
  }

  async queryStatus(providerTransactionId: string): Promise<CanonicalPaymentStatus> {
    return {
      status: 'PENDING',
      amount: 500,
      rawResponse: { providerTransactionId, provider: 'MANUAL_UPI' }
    };
  }

  async parseWebhook(): Promise<CanonicalPaymentEvent> {
    throw new Error('Webhooks are not supported on Manual UPI adapter.');
  }
}

/**
 * Razorpay Adapter Skeleton (Phase 1 Partner Integration)
 */
export class RazorpayAdapter implements IPaymentProviderAdapter {
  readonly providerName: PaymentProvider = 'RAZORPAY';

  constructor(private account: TenantPaymentAccount) {}

  async createOrder(input: CreatePaymentInput): Promise<ProviderPaymentOrder> {
    const providerTransactionId = `rzp_order_${Date.now()}`;
    return {
      providerTransactionId,
      provider: 'RAZORPAY',
      checkoutPayload: {
        amount: input.amount * 100, // paise
        currency: input.currency,
        orderId: providerTransactionId,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async queryStatus(providerTransactionId: string): Promise<CanonicalPaymentStatus> {
    return {
      status: 'SUCCESS',
      amount: 500,
      rawResponse: { providerTransactionId, provider: 'RAZORPAY' }
    };
  }

  async parseWebhook(headers: Record<string, string>, rawBody: string): Promise<CanonicalPaymentEvent> {
    const body = JSON.parse(rawBody);
    return {
      eventType: 'PAYMENT_CAPTURED',
      merchantReference: body.payload?.payment?.entity?.order_id || '',
      providerTransactionId: body.payload?.payment?.entity?.id || '',
      bankReference: body.payload?.payment?.entity?.acquirer_data?.rrn || '',
      amount: (body.payload?.payment?.entity?.amount || 0) / 100,
      status: 'SUCCESS',
      rawPayload: body,
    };
  }
}

/**
 * Payment Router with Strict Fallback and Server-Side Amount Validation
 */
export class PaymentRouter {
  static getAdapter(account: TenantPaymentAccount): IPaymentProviderAdapter {
    switch (account.provider) {
      case 'MANUAL_UPI':
        return new ManualUpiAdapter(account);
      case 'RAZORPAY':
        return new RazorpayAdapter(account);
      default:
        throw new UnsupportedPaymentProviderError(account.provider);
    }
  }

  /**
   * Derive and validate server-side total price and advance amounts (never trust browser values)
   */
  static deriveBookingFinancials(
    packageName: string,
    durationHours: number,
    guestCount: number,
    addons: { name: string; price: number; quantity?: number }[] = []
  ): { basePrice: number; extraGuestCharge: number; addonsTotal: number; totalPrice: number; advanceRequired: number; balanceDue: number } {
    const lower = packageName.toLowerCase();
    let basePrice = 999;
    let isGaming = lower.includes('gaming') || lower.includes('dark');

    if (isGaming) {
      basePrice = Math.round(399 * Math.max(1, durationHours));
    } else {
      let packageRate = 999;
      if (lower.includes('red')) packageRate = 799;
      else if (lower.includes('pink')) packageRate = 899;
      else if (lower.includes('purple')) packageRate = 999;

      basePrice = Math.round((packageRate / 2) * Math.max(2, durationHours));
    }

    const extraGuestCharge = guestCount > 2 ? (guestCount - 2) * 100 : 0;
    const addonsTotal = addons.reduce((sum, a) => sum + (a.price * (a.quantity || 1)), 0);
    const totalPrice = basePrice + extraGuestCharge + addonsTotal;
    const advanceRequired = isGaming ? Math.min(basePrice, 500) : 500;
    const balanceDue = Math.max(0, totalPrice - advanceRequired);

    return {
      basePrice,
      extraGuestCharge,
      addonsTotal,
      totalPrice,
      advanceRequired,
      balanceDue,
    };
  }
}
