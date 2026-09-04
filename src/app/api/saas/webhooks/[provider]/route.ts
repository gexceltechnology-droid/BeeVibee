import { NextRequest, NextResponse } from 'next/server';
import { AuthoritativeWebhookHandler } from '@/lib/saas/webhookHandler';
import { Pool } from 'pg';

let pool: Pool | null = null;

function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured for webhook processing.');
    }
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params; const provider = rawProvider || 'RAZORPAY';

  try {
    // 1. Read raw bytes once as ArrayBuffer/Buffer for exact HMAC verification
    const arrayBuffer = await request.arrayBuffer();
    const rawBodyBuffer = Buffer.from(arrayBuffer);

    // 2. Extract headers
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    // 3. Process authoritative webhook
    const dbPool = getDbPool();
    const result = await AuthoritativeWebhookHandler.processWebhook({
      provider,
      rawBody: rawBodyBuffer,
      headers: headersObj,
    }, dbPool);

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    console.error(`[Webhook Ingress Exception - ${provider}]:`, error);
    return NextResponse.json(
      {
        statusCode: 500,
        success: false,
        message: error.message || 'Internal webhook processing error',
      },
      { status: 500 }
    );
  }
}

