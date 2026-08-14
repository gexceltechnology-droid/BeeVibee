import { NextRequest, NextResponse } from 'next/server';
import { processWhatsAppBotMessage } from '@/lib/whatsappBot';
import { sendWhatsAppViaMetaCloudApi, sendWhatsAppViaCallMeBot } from '@/lib/whatsapp';

/**
 * GET /api/whatsapp
 * Meta WhatsApp Cloud API Webhook Verification Endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const urlObj = new URL(request.url);
    const searchParams = urlObj.searchParams;

    const mode = searchParams.get('hub.mode') || searchParams.get('hub_mode') || searchParams.get('mode');
    const token = searchParams.get('hub.verify_token') || searchParams.get('hub_verify_token') || searchParams.get('token');
    const challenge = searchParams.get('hub.challenge') || searchParams.get('hub_challenge') || searchParams.get('challenge');

    const expectedToken = process.env.META_WHATSAPP_VERIFY_TOKEN || 'beevibe_bot_secret_2026';

    // Return plain text challenge for Meta Webhook verification
    if (challenge) {
      console.log(`[WhatsApp Webhook Verified] Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return NextResponse.json(
      {
        status: 'BeeVibe WhatsApp Bot Webhook API Running',
        instructions: 'Pass hub.mode=subscribe and hub.verify_token=beevibe_bot_secret_2026 for verification.',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return new Response('Error parsing request', { status: 400 });
  }
}

/**
 * POST /api/whatsapp
 * Processes incoming WhatsApp messages and triggers automated bot replies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Interactive Bot API test or custom client invocation
    if (body.message && typeof body.message === 'string') {
      const botRes = processWhatsAppBotMessage(body.message, body.phone || '');
      return NextResponse.json({
        success: true,
        response: botRes,
      });
    }

    // 2. Meta Official WhatsApp Cloud API Webhook Payload
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (message && message.text?.body) {
      const fromPhone = message.from; // Sender WhatsApp phone number
      const incomingText = message.text.body;

      console.log(`[WhatsApp Bot Incoming] From +${fromPhone}: "${incomingText}"`);

      // Compute Bot reply
      const botResponse = processWhatsAppBotMessage(incomingText, fromPhone);

      // Reply via Meta WhatsApp Cloud API
      const metaResult = await sendWhatsAppViaMetaCloudApi(fromPhone, botResponse.replyText);

      // Fallback reply via CallMeBot if configured
      if (!metaResult.success) {
        await sendWhatsAppViaCallMeBot(fromPhone, botResponse.replyText);
      }

      return NextResponse.json({ success: true, processed: true, reply: botResponse.replyText });
    }

    return NextResponse.json({ success: true, status: 'Payload received, no actionable text message.' });
  } catch (error: any) {
    console.error('[WhatsApp Bot Webhook Exception]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
