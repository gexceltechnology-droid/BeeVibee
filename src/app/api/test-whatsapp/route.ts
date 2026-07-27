import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminWhatsAppNumber,
  sendWhatsAppViaTwilio,
  sendWhatsAppViaCallMeBot,
  sendWhatsAppViaWebhook,
} from '@/lib/whatsapp';
import { sendSMS } from '@/lib/sms';
import { sendAdminNotificationEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
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
}
