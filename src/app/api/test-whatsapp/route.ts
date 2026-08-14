import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminWhatsAppNumber,
  sendWhatsAppViaTwilio,
  sendWhatsAppViaCallMeBot,
  sendWhatsAppViaMetaCloudApi,
} from '@/lib/whatsapp';
import { processWhatsAppBotMessage } from '@/lib/whatsappBot';
import { sendSMS } from '@/lib/sms';
import { sendAdminNotificationEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  try {
    const urlObj = new URL(request.url);
    const searchParams = urlObj.searchParams;

    const mode = searchParams.get('hub.mode') || searchParams.get('hub_mode') || searchParams.get('mode');
    const token = searchParams.get('hub.verify_token') || searchParams.get('hub_verify_token') || searchParams.get('token');
    const challenge = searchParams.get('hub.challenge') || searchParams.get('hub_challenge') || searchParams.get('challenge');

    // Return plain text challenge for Meta Webhook verification
    if (challenge) {
      console.log(`[WhatsApp Webhook Verified] Challenge: ${challenge}`);
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const phone = searchParams.get('phone') || getAdminWhatsAppNumber();

    const testMessage = `🐝 TEST ALERT - BEE VIBE WHATSAPP SYSTEM 🐝\nTimestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\nIf you received this message, WhatsApp notifications are 100% working for +${phone}!`;

    console.log(`[TEST WHATSAPP ROUTE] Testing notifications for +${phone}...`);

    const results: Record<string, any> = {};

    // 1. Test CallMeBot
    try {
      const callmebotRes = await sendWhatsAppViaCallMeBot(phone, testMessage);
      results.callmebot = callmebotRes;
    } catch (e: any) {
      results.callmebot = { success: false, error: e.message };
    }

    // 2. Test Twilio WhatsApp
    try {
      const twilioWaRes = await sendWhatsAppViaTwilio(phone, testMessage);
      results.twilioWhatsApp = twilioWaRes;
    } catch (e: any) {
      results.twilioWhatsApp = { success: false, error: e.message };
    }

    // 3. Test Twilio SMS
    try {
      const smsRes = await sendSMS(`+${phone}`, testMessage);
      results.twilioSMS = smsRes;
    } catch (e: any) {
      results.twilioSMS = { success: false, error: e.message };
    }

    // 4. Test Email Alert
    try {
      await sendAdminNotificationEmail('🐝 Bee Vibe WhatsApp Test Alert', `<p>${testMessage}</p>`);
      results.adminEmail = { success: true };
    } catch (e: any) {
      results.adminEmail = { success: false, error: e.message };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      targetPhone: phone,
      callmebotApiKeyPresent: !!process.env.CALLMEBOT_API_KEY,
      twilioAccountSidPresent: !!process.env.TWILIO_ACCOUNT_SID,
      results,
      instructions: {
        callmebotSetup: "To enable free WhatsApp alerts via CallMeBot: Send 'I allow callmebot to send me messages' on WhatsApp from +919900106474 to +34 644 44 49 53. CallMeBot will reply with your API Key. Add CALLMEBOT_API_KEY=<key> to Vercel environment variables.",
      }
    });
  } catch (err: any) {
    return new Response('Error handling test GET request', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.message && typeof body.message === 'string') {
      const botRes = processWhatsAppBotMessage(body.message, body.phone || '');
      return NextResponse.json({
        success: true,
        response: botRes,
      });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (message && message.text?.body) {
      const fromPhone = message.from;
      const incomingText = message.text.body;

      console.log(`[WhatsApp Bot Incoming] From +${fromPhone}: "${incomingText}"`);
      const botResponse = processWhatsAppBotMessage(incomingText, fromPhone);
      const metaResult = await sendWhatsAppViaMetaCloudApi(fromPhone, botResponse.replyText);

      if (!metaResult.success) {
        await sendWhatsAppViaCallMeBot(fromPhone, botResponse.replyText);
      }

      return NextResponse.json({ success: true, processed: true, reply: botResponse.replyText });
    }

    return NextResponse.json({ success: true, status: 'Payload received.' });
  } catch (error: any) {
    console.error('[WhatsApp Bot Webhook Exception]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
