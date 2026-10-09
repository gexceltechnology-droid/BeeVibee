import { NextRequest, NextResponse } from 'next/server';
import {
  getTelegramBotInfo,
  getRecentTelegramUpdates,
  sendTelegramNotification,
  getTelegramBotToken,
  getTelegramChatId,
} from '@/lib/telegram';

/**
 * GET /api/telegram
 * Inspects @digmabeevibe_bot status and retrieves incoming chat IDs
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTelegramBotToken();
    const chatId = getTelegramChatId();

    if (!token) {
      return NextResponse.json({
        configured: false,
        botUsername: '@digmabeevibe_bot',
        message: 'TELEGRAM_BOT_TOKEN is not configured in .env.local yet.',
        instructions: [
          '1. Open @BotFather on Telegram.',
          '2. Copy the HTTP API token for @digmabeevibe_bot.',
          '3. Add TELEGRAM_BOT_TOKEN=<your-token> to .env.local.',
          '4. Open @digmabeevibe_bot on Telegram and click "Start".',
          '5. Add TELEGRAM_CHAT_ID=<your-chat-id> to .env.local.',
        ],
      });
    }

    const [botInfoRes, updatesRes] = await Promise.all([
      getTelegramBotInfo(),
      getRecentTelegramUpdates(),
    ]);

    return NextResponse.json({
      configured: true,
      hasChatId: Boolean(chatId),
      chatId: chatId || null,
      bot: botInfoRes.bot || null,
      botError: botInfoRes.error || null,
      recentChats: updatesRes.candidates || [],
      tip: !chatId
        ? 'Send /start or any message to @digmabeevibe_bot in Telegram, then refresh this endpoint to find your Chat ID.'
        : 'Bot is configured and ready to send real-time customer booking alerts.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/telegram
 * Send an immediate test booking alert through @digmabeevibe_bot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetChat = body.chatId || getTelegramChatId();

    if (!targetChat) {
      return NextResponse.json(
        {
          error:
            'No chat_id provided. Please send /start to @digmabeevibe_bot or provide chatId in request body.',
        },
        { status: 400 }
      );
    }

    const testBookingAlert =
      `🎉 TEST BOOKING ALERT - BEE VIBE 🎉\n` +
      `----------------------------------------\n` +
      `📢 Bot: @digmabeevibe_bot is ACTIVE!\n` +
      `----------------------------------------\n` +
      `🆔 Ticket Code: #BV-TEST-${Math.floor(1000 + Math.random() * 9000)}\n` +
      `👤 Guest Name: Rahul Sharma\n` +
      `📞 Phone: +919900106474\n` +
      `🎭 Room: Angel Wings & Birthday Stage\n` +
      `📅 Date: ${new Date().toISOString().split('T')[0]}\n` +
      `⏰ Time Slot: 06:00 PM - 08:00 PM\n` +
      `👥 Guests: 2 Head(s)\n` +
      `💰 Total: ₹1299 | Advance: ₹500 | Balance: ₹799\n` +
      `----------------------------------------\n` +
      `✅ If you see this, real-time customer booking alerts to Telegram are working perfectly!`;

    const sendRes = await sendTelegramNotification(testBookingAlert, targetChat);

    if (sendRes.success) {
      return NextResponse.json({
        success: true,
        message: `Test alert successfully sent to Telegram chat ${targetChat}!`,
        messageId: sendRes.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: sendRes.error,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
