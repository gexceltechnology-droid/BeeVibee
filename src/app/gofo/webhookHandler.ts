/**
 * Multi-Tenant Authoritative Webhook Ingress & Financial Settlement Pipeline
 * 
 * Pipeline guarantees:
 * 1. Provider-Specific Raw-Byte Signature Verification (constant-time timingSafeEqual).
 * 2. Zero database writes & zero mutations on invalid signature (immediate 401).
 * 3. Layer 1 Idempotency: Deduplication on webhook_events (provider, event_id).
 * 4. Tenant & Order Isolation: Resolves tenant strictly from database payment_orders (never trusts payload tenant_id).
 * 5. Pessimistic Row Locking: SELECT ... FOR UPDATE on payment_orders and bookings.
 * 6. Composite Relationship Integrity: Validates payment_order -> booking -> tenant chain.
 * 7. Exact Financial & Currency Verification: Validates amount and currency match expected order.
 * 8. Layer 2 Idempotency: Deduplication on payment_transactions (provider, provider_transaction_id).
 * 9. Dynamic Financial Derivation: Real-time calculation of advance_amount, balance_amount, and payment_status.
 */

import { Pool, PoolClient } from 'pg';
import { PaymentRouter, NormalizedPaymentEvent } from './paymentRouter';

export interface WebhookIngressRequest {
  provider: string;
  rawBody: Buffer | string;
  headers: Record<string, string | string[] | undefined>;
  webhookSecret?: string;
}

export interface WebhookIngressResult {
  statusCode: number;
  success: boolean;
  message: string;
  settled?: boolean;
  duplicateEvent?: boolean;
  alreadySettled?: boolean;
  ignored?: boolean;
  reason?: string;
  details?: {
    tenantId?: string;
    bookingId?: string;
    paymentOrderId?: string;
    transactionId?: string;
    totalAmount?: number;
    advanceAmount?: number;
    balanceAmount?: number;
    paymentStatus?: string;
  };
}

export class AuthoritativeWebhookHandler {
  /**
   * Main entrypoint for processing incoming provider webhooks
   */
  static async processWebhook(
    req: WebhookIngressRequest,
    dbClientOrPool: Pool | PoolClient
  ): Promise<WebhookIngressResult> {
    const providerName = (req.provider || '').toUpperCase();

    // 1. Resolve Provider-Specific Verifier
    let verifier;
    try {
      verifier = PaymentRouter.getWebhookVerifier(providerName);
    } catch (e: any) {
      return {
        statusCode: 400,
        success: false,
        message: `Unsupported webhook provider: ${req.provider}`,
      };
    }

    // 2. Resolve Webhook Secret (from param or environment)
    const secret = req.webhookSecret || 
      process.env[`${providerName}_WEBHOOK_SECRET`] || 
      process.env.PAYMENT_WEBHOOK_SECRET || 
      'rzp_whsec_beevibe_sandbox_secret';

    // 3. Provider-Specific Raw Signature Verification
    // CRITICAL: Must reject BEFORE any database write or financial mutation
    const isSignatureValid = verifier.verify({
      rawBody: req.rawBody,
      headers: req.headers,
      secret,
    });

    if (!isSignatureValid) {
      return {
        statusCode: 401,
        success: false,
        message: 'Invalid webhook signature. Request rejected before database mutation.',
      };
    }

    // 4. Parse & Normalize Provider Event
    let normalized: NormalizedPaymentEvent;
    try {
      normalized = verifier.normalize({
        rawBody: req.rawBody,
        headers: req.headers,
      });
    } catch (parseErr: any) {
      return {
        statusCode: 400,
        success: false,
        message: `Failed to parse webhook body: ${parseErr.message}`,
      };
    }

    // 5. Execute Transactional Settlement with Multi-Layer Deduplication & Row Locks
    const isPool = 'connect' in dbClientOrPool && typeof dbClientOrPool.connect === 'function';
    const client: PoolClient = isPool ? await (dbClientOrPool as Pool).connect() : (dbClientOrPool as PoolClient);

    try {
      await client.query('BEGIN;');

      // Layer 1 Idempotency: Insert into webhook_events with UNIQUE (provider, event_id)
      const eventInsertRes = await client.query(`
        INSERT INTO webhook_events (
          provider, 
          event_id, 
          event_type, 
          signature_valid, 
          payload, 
          processing_status
        ) VALUES (
          $1, $2, $3, true, $4, 'PENDING'
        ) 
        ON CONFLICT (provider, event_id) DO NOTHING
        RETURNING id;
      `, [
        providerName,
        normalized.eventId,
        normalized.eventType,
        JSON.stringify(normalized.rawPayload),
      ]);

      const isNewEvent = eventInsertRes.rows.length > 0;
      const webhookEventDbId = isNewEvent ? eventInsertRes.rows[0].id : null;

      if (!isNewEvent) {
        // Event was already ingested! Layer 1 deduplication succeeded.
        await client.query('COMMIT;');
        return {
          statusCode: 200,
          success: true,
          duplicateEvent: true,
          message: 'Webhook event already ingested and deduplicated (Layer 1 Idempotency).',
        };
      }

      // Check if event is authoritative for payment settlement
      const isAuthoritativeEvent = 
        (normalized.eventType === 'PAYMENT_CAPTURED' || normalized.eventType === 'ORDER_PAID') &&
        normalized.status === 'SUCCESS';

      if (!isAuthoritativeEvent) {
        // Unsupported or informational event (e.g. UNKNOWN, dispute, refund speed changed)
        await client.query(`
          UPDATE webhook_events 
          SET processing_status = 'IGNORED', processed_at = NOW() 
          WHERE id = $1;
        `, [webhookEventDbId]);

        await client.query('COMMIT;');
        return {
          statusCode: 200,
          success: true,
          ignored: true,
          message: `Event type ${normalized.eventType} is recorded as IGNORED without financial mutation.`,
          reason: `Event type ${normalized.eventType} is recorded as IGNORED without financial mutation.`,
        };
      }

      // 6. Resolve Tenant & Payment Order via Provider Reference (Never trust payload tenant_id)
      const orderRes = await client.query(`
        SELECT 
          po.id, 
          po.tenant_id, 
          po.booking_id, 
          po.customer_id, 
          po.amount, 
          po.currency, 
          po.status, 
          po.merchant_reference,
          tpa.id AS payment_account_id
        FROM payment_orders po
        LEFT JOIN tenant_payment_accounts tpa ON tpa.tenant_id = po.tenant_id AND tpa.provider = $1
        WHERE (po.merchant_reference = $2 OR po.id::text = $2)
        FOR UPDATE OF po;
      `, [providerName, normalized.providerOrderId]);

      if (orderRes.rows.length === 0) {
        await client.query(`
          UPDATE webhook_events 
          SET processing_status = 'IGNORED', error_log = 'Payment order not found for provider reference', processed_at = NOW() 
          WHERE id = $1;
        `, [webhookEventDbId]);

        await client.query('COMMIT;');
        return {
          statusCode: 200,
          success: true,
          ignored: true,
          message: `No corresponding payment_orders record found for provider order reference: ${normalized.providerOrderId}`,
          reason: `No corresponding payment_orders record found for provider order reference: ${normalized.providerOrderId}`,
        };
      }

      const paymentOrder = orderRes.rows[0];
      const tenantId = paymentOrder.tenant_id;

      // Associate tenant_id with the webhook_event
      await client.query(`UPDATE webhook_events SET tenant_id = $1 WHERE id = $2;`, [tenantId, webhookEventDbId]);

      // 7. Resolve & Lock Booking with Tenant Relationship Verification
      const bookingRes = await client.query(`
        SELECT 
          id, 
          tenant_id, 
          total_amount, 
          advance_amount, 
          balance_amount, 
          payment_status, 
          booking_status
        FROM bookings
        WHERE id = $1 AND tenant_id = $2
        FOR UPDATE;
      `, [paymentOrder.booking_id, tenantId]);

      if (bookingRes.rows.length === 0) {
        await client.query(`
          UPDATE webhook_events 
          SET processing_status = 'FAILED', error_log = 'Cross-tenant binding mismatch or booking not found', processed_at = NOW() 
          WHERE id = $1;
        `, [webhookEventDbId]);

        await client.query('COMMIT;');
        return {
          statusCode: 400,
          success: false,
          message: 'Cross-tenant binding mismatch: booking does not belong to order tenant.',
        };
      }

      const booking = bookingRes.rows[0];

      // 8. Amount & Currency Invariant Verification
      const expectedAmount = Number(paymentOrder.amount);
      const receivedAmount = Number(normalized.amount);
      const expectedCurrency = String(paymentOrder.currency || 'INR').toUpperCase();
      const receivedCurrency = String(normalized.currency || 'INR').toUpperCase();

      if (receivedAmount !== expectedAmount || receivedCurrency !== expectedCurrency) {
        await client.query(`
          UPDATE webhook_events 
          SET processing_status = 'FAILED', 
              error_log = $1, 
              processed_at = NOW() 
          WHERE id = $2;
        `, [
          `Financial mismatch: Expected ${expectedCurrency} ${expectedAmount}, received ${receivedCurrency} ${receivedAmount}`,
          webhookEventDbId
        ]);

        await client.query('COMMIT;');
        return {
          statusCode: 400,
          success: false,
          message: `Financial amount or currency mismatch. Expected ${expectedCurrency} ${expectedAmount}, got ${receivedCurrency} ${receivedAmount}. Settlement rejected.`,
        };
      }

      // 9. Layer 2 Idempotency: Payment Transaction Deduplication (Unique Provider Transaction ID)
      // Protects when multiple webhook events (e.g. payment.captured AND order.paid) describe the same payment
      const existingTxnRes = await client.query(`
        SELECT id, status 
        FROM payment_transactions 
        WHERE tenant_id = $1 
          AND provider = $2 
          AND provider_transaction_id = $3
        FOR UPDATE;
      `, [tenantId, providerName, normalized.providerPaymentId]);

      if (existingTxnRes.rows.length > 0 && existingTxnRes.rows[0].status === 'SUCCESS') {
        // Payment was already credited by a prior event! Layer 2 deduplication.
        await client.query(`
          UPDATE webhook_events 
          SET processing_status = 'PROCESSED', processed_at = NOW() 
          WHERE id = $1;
        `, [webhookEventDbId]);

        await client.query('COMMIT;');
        return {
          statusCode: 200,
          success: true,
          alreadySettled: true,
          message: 'Payment transaction already settled and credited (Layer 2 Idempotency). No double credit.',
          details: {
            tenantId,
            bookingId: booking.id,
            paymentOrderId: paymentOrder.id,
            transactionId: existingTxnRes.rows[0].id,
            advanceAmount: Number(booking.advance_amount),
            balanceAmount: Number(booking.balance_amount),
            paymentStatus: booking.payment_status,
          }
        };
      }

      // 10. Insert Payment Transaction Record
      let paymentAccountId = paymentOrder.payment_account_id;
      if (!paymentAccountId) {
        // Fallback or retrieve first available account for tenant
        const accRes = await client.query(`
          SELECT id FROM tenant_payment_accounts 
          WHERE tenant_id = $1 
          ORDER BY created_at ASC LIMIT 1;
        `, [tenantId]);
        if (accRes.rows.length > 0) {
          paymentAccountId = accRes.rows[0].id;
        }
      }

      const txnInsertRes = await client.query(`
        INSERT INTO payment_transactions (
          tenant_id,
          payment_order_id,
          tenant_payment_account_id,
          provider,
          provider_transaction_id,
          bank_reference,
          amount,
          currency,
          status,
          raw_provider_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'SUCCESS', $9
        ) RETURNING id;
      `, [
        tenantId,
        paymentOrder.id,
        paymentAccountId,
        providerName,
        normalized.providerPaymentId,
        normalized.bankReference || null,
        receivedAmount,
        receivedCurrency,
        JSON.stringify(normalized.rawPayload)
      ]);

      const transactionId = txnInsertRes.rows[0].id;

      // 11. Update Payment Order to SUCCESS
      await client.query(`
        UPDATE payment_orders 
        SET status = 'SUCCESS', updated_at = NOW() 
        WHERE id = $1 AND tenant_id = $2;
      `, [paymentOrder.id, tenantId]);

      // 12. Dynamic Production Financial Derivation (No Hardcoded Values)
      const totalAmount = Number(booking.total_amount);
      const existingAdvance = Number(booking.advance_amount || 0);
      const newAdvance = existingAdvance + receivedAmount;
      const newBalance = Math.max(0, totalAmount - newAdvance);
      const newPaymentStatus = newBalance === 0 ? 'FULLY_PAID' : 'ADVANCE_PAID';

      await client.query(`
        UPDATE bookings 
        SET 
          advance_amount = $1,
          balance_amount = $2,
          payment_status = $3,
          booking_status = 'CONFIRMED',
          updated_at = NOW()
        WHERE id = $4 AND tenant_id = $5;
      `, [newAdvance, newBalance, newPaymentStatus, booking.id, tenantId]);

      // 13. Mark Webhook Event as PROCESSED
      await client.query(`
        UPDATE webhook_events 
        SET processing_status = 'PROCESSED', processed_at = NOW() 
        WHERE id = $1;
      `, [webhookEventDbId]);

      await client.query('COMMIT;');

      return {
        statusCode: 200,
        success: true,
        settled: true,
        message: 'Payment successfully settled with atomic financial derivation.',
        details: {
          tenantId,
          bookingId: booking.id,
          paymentOrderId: paymentOrder.id,
          transactionId,
          totalAmount,
          advanceAmount: newAdvance,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus,
        }
      };
    } catch (err: any) {
      await client.query('ROLLBACK;').catch(() => {});
      console.error('[AuthoritativeWebhookHandler Exception]:', err);
      return {
        statusCode: 500,
        success: false,
        message: `Database transaction error during webhook processing: ${err.message}`,
      };
    } finally {
      if (isPool) {
        client.release();
      }
    }
  }
}
