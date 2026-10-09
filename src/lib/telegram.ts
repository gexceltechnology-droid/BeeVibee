/**
 * Telegram Bot Integration for @digmabeevibe_bot
 * Instant, 100% free server-side real-time alerts on new customer bookings & food orders.
 */

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
}

export interface TelegramChatCandidate {
  chatId: string | number;
  type: string;
  titleOrName: string;
  username?: string;
  lastMessage?: string;
  date?: Date;
}

/**
 * Get current configured Bot Token
 */
export function getTelegramBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

/**
 * Get current configured Chat ID
 */
export function getTelegramChatId(): string {
  return (process.env.TELEGRAM_CHAT_ID || '').trim();
}

/**
 * Test connectivity and get info about @digmabeevibe_bot
 */
export async function getTelegramBotInfo(): Promise<{
  success: boolean;
  bot?: TelegramBotInfo;
  error?: string;
}> {
  const token = getTelegramBotToken();
  if (!token) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured in .env.local' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      return { success: true, bot: data.result };
    }
    return { success: false, error: data.description || 'Failed to fetch bot info from Telegram' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error fetching bot info' };
  }
}

/**
 * Inspect recent incoming messages to @digmabeevibe_bot
 * Useful to detect the Chat ID after the owner clicks /start in Telegram.
 */
export async function getRecentTelegramUpdates(): Promise<{
  success: boolean;
  candidates: TelegramChatCandidate[];
  error?: string;
}> {
  const token = getTelegramBotToken();
  if (!token) {
    return { success: false, candidates: [], error: 'TELEGRAM_BOT_TOKEN is not configured.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      cache: 'no-store',
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      return { success: false, candidates: [], error: data.description || 'Failed to fetch updates' };
    }

    const updates = Array.isArray(data.result) ? data.result : [];
    const chatMap = new Map<string | number, TelegramChatCandidate>();

    for (const update of updates) {
      const msg = update.message || update.channel_post || update.my_chat_member;
      if (!msg || !msg.chat) continue;

      const chat = msg.chat;
      const titleOrName =
        chat.title ||
        [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
        chat.username ||
        `Chat ${chat.id}`;

      chatMap.set(chat.id, {
        chatId: chat.id,
        type: chat.type || 'unknown',
        titleOrName,
        username: chat.username,
        lastMessage: msg.text || (msg.new_chat_member ? 'Member added' : undefined),
        date: msg.date ? new Date(msg.date * 1000) : undefined,
      });
    }

    return {
      success: true,
      candidates: Array.from(chatMap.values()),
    };
  } catch (err: any) {
    return { success: false, candidates: [], error: err.message };
  }
}

/**
 * Send instant alert message to Telegram (@digmabeevibe_bot)
 */
export async function sendTelegramNotification(
  message: string,
  targetChatId?: string | number
): Promise<TelegramSendResult> {
  const botToken = getTelegramBotToken();
  const chatId = targetChatId || getTelegramChatId();

  if (!botToken) {
    console.warn('[Telegram Alert] TELEGRAM_BOT_TOKEN not configured in .env.local');
    return { success: false, error: 'TELEGRAM_BOT_TOKEN is not configured' };
  }

  if (!chatId) {
    console.warn('[Telegram Alert] TELEGRAM_CHAT_ID not configured in .env.local');
    return { success: false, error: 'TELEGRAM_CHAT_ID is not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      console.log(`[Telegram Alert Success] Instant alert delivered to Telegram Chat ${chatId}`);
      return { success: true, messageId: data.result?.message_id };
    } else {
      console.error('[Telegram Alert Error]:', data.description || data);
      return { success: false, error: data.description || 'Telegram API returned an error' };
    }
  } catch (err: any) {
    console.error('[Telegram Alert Exception]:', err);
    return { success: false, error: err.message || 'Exception sending telegram message' };
  }
}
