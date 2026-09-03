/**
 * BeeVibe WhatsApp Bot Conversation Engine
 * Handles intent detection and automatic responses for customer inquiries
 */

export interface BotResponse {
  replyText: string;
  options?: Array<{ id: string; text: string }>;
  actionLink?: string;
}

export function processWhatsAppBotMessage(incomingMessage: string, _phone: string = ''): BotResponse {
  const cleanMsg = (incomingMessage || '').trim().toLowerCase();

  // 1. Menu selection or greetings
  if (
    cleanMsg === 'hi' ||
    cleanMsg === 'hello' ||
    cleanMsg === 'hey' ||
    cleanMsg === 'menu' ||
    cleanMsg === 'start' ||
    cleanMsg === '0' ||
    cleanMsg === 'help'
  ) {
    return {
      replyText:
        `🐝 *Welcome to BeeVibe Private Theater & Celebration Lounge!* 🎬✨\n\n` +
        `How can I assist you today? Please reply with a option number:\n\n` +
        `1️⃣ *View Packages & Prices*\n` +
        `2️⃣ *Check Available Slots & Book*\n` +
        `3️⃣ *View Food & Snacks Menu*\n` +
        `4️⃣ *Venue Location & Directions*\n` +
        `5️⃣ *Talk to Live Support / Owner*\n\n` +
        `Reply *1, 2, 3, 4, or 5* to explore!`,
      options: [
        { id: '1', text: '1. Packages & Prices' },
        { id: '2', text: '2. Book Slot' },
        { id: '3', text: '3. Food Menu' },
        { id: '4', text: '4. Location' },
        { id: '5', text: '5. Contact Owner' },
      ],
    };
  }

  // Option 1: Packages & Prices
  if (cleanMsg === '1' || cleanMsg.includes('package') || cleanMsg.includes('price') || cleanMsg.includes('cost')) {
    return {
      replyText:
        `🎟️ *BEE VIBE PRIVATE THEATER THEMES* 🎟️
----------------------------------------
❤️ *Red Theme (Red Velvet Romance)* — ₹799 / 2 Hours
• Base 2 Guests (Extra Guest: ₹100/head)
• Floral Heart & "Happy Anniversary" Neon Backdrop
• 180" 4K Screen & 7.1 Dolby Surround Sound

🩷 *Pink Theme (Angel Wings & Neon)* — ₹899 / 2 Hours
• Base 2 Guests (Extra Guest: ₹100/head)
• Giant Glowing Angel Wings & "Happy Birthday" Arch
• Hot Pink Plush Recliners & 180" 4K Screen

💜 *Purple Theme (Royal Butterfly Grandeur)* — ₹999 / 2 Hours
• Base 2 Guests (Extra Guest: ₹100/head)
• Grand Triple Arched Decor, Butterfly Wings & Marquee Letters
• 180" 4K Screen, Dolby Sound & VIP Privacy
----------------------------------------
Reply *2* to Check Available Time Slots!`,
      options: [
        { id: '2', text: 'Check Available Slots' },
        { id: '0', text: 'Main Menu' },
      ],
      actionLink: 'https://www.beevibe.org/#booking',
    };
  }

  // Option 2: Slots & Booking
  if (
    cleanMsg === '2' ||
    cleanMsg.includes('slot') ||
    cleanMsg.includes('book') ||
    cleanMsg.includes('reserve') ||
    cleanMsg.includes('timing')
  ) {
    return {
      replyText:
        `📅 *SLOT AVAILABILITY & RESERVATIONS* 📅\n` +
        `----------------------------------------\n` +
        `We operate slots daily from 10:00 AM to 12:00 AM (Midnight)!\n\n` +
        `⏰ *Popular Slots*:\n` +
        `• Morning: 10:00 AM - 12:00 PM\n` +
        `• Afternoon: 01:00 PM - 03:00 PM\n` +
        `• Evening: 04:00 PM - 06:00 PM\n` +
        `• Night Prime: 07:00 PM - 09:00 PM\n` +
        `• Midnight Vibe: 10:00 PM - 12:00 AM\n\n` +
        `🔗 Click below to pick your date, theme & book in 60 seconds:\n` +
        `https://www.beevibe.org/#booking\n\n` +
        `Reply *0* for Main Menu`,
      options: [
        { id: '3', text: 'View Food Menu' },
        { id: '0', text: 'Main Menu' },
      ],
      actionLink: 'https://www.beevibe.org/#booking',
    };
  }

  // Option 3: Food Menu
  if (
    cleanMsg === '3' ||
    cleanMsg.includes('food') ||
    cleanMsg.includes('snack') ||
    cleanMsg.includes('menu') ||
    cleanMsg.includes('drink') ||
    cleanMsg.includes('eat')
  ) {
    return {
      replyText:
        `🍿 *BEE VIBE CAFE & IN-THEATER FOOD MENU* 🍿\n` +
        `----------------------------------------\n` +
        `🍿 *Popular Snacks*:\n` +
        `• Butter Cheese Popcorn - ₹120\n` +
        `• Loaded Cheese Nachos - ₹160\n` +
        `• Peri Peri French Fries - ₹140\n` +
        `• Crispy Veg Nuggets - ₹150\n\n` +
        `🥤 *Cool Beverages*:\n` +
        `• Iced Cold Coffee - ₹130\n` +
        `• Blue Ocean Mocktail - ₹120\n` +
        `• Virgin Mojito - ₹110\n\n` +
        `🔗 Order fresh food to your theater screen:\n` +
        `https://www.beevibe.org/menu\n\n` +
        `Reply *0* for Main Menu`,
      options: [
        { id: '2', text: 'Book Room Slot' },
        { id: '0', text: 'Main Menu' },
      ],
      actionLink: 'https://www.beevibe.org/menu',
    };
  }

  // Option 4: Location & Directions
  if (
    cleanMsg === '4' ||
    cleanMsg.includes('location') ||
    cleanMsg.includes('address') ||
    cleanMsg.includes('where') ||
    cleanMsg.includes('map') ||
    cleanMsg.includes('directions')
  ) {
    return {
      replyText:
        `📍 *BEE VIBE VENUE LOCATION* 📍\n` +
        `----------------------------------------\n` +
        `🏢 *Address*:\n` +
        `1340, 2nd Floor, 41st Cross Road,\n` +
        `4th Gate, Opposite Jain University,\n` +
        `Jayanagar 9th Block, Bengaluru, Karnataka 560041.\n\n` +
        `🗺️ *Google Maps Link*:\n` +
        `https://maps.google.com/?q=BeeVibe+Jayanagar\n\n` +
        `🚗 Free parking available near venue!\n\n` +
        `Reply *0* for Main Menu`,
      options: [
        { id: '2', text: 'Book Slot Now' },
        { id: '5', text: 'Call Owner' },
      ],
      actionLink: 'https://maps.google.com/?q=BeeVibe+Jayanagar',
    };
  }

  // Option 5: Contact Live Support / Owner
  if (
    cleanMsg === '5' ||
    cleanMsg.includes('support') ||
    cleanMsg.includes('contact') ||
    cleanMsg.includes('call') ||
    cleanMsg.includes('owner') ||
    cleanMsg.includes('human') ||
    cleanMsg.includes('talk')
  ) {
    return {
      replyText:
        `📞 *BEE VIBE LIVE SUPPORT & HELPLINE* 📞\n` +
        `----------------------------------------\n` +
        `Need custom birthday decor, anniversary setup, or instant assistance?\n\n` +
        `📲 *Direct WhatsApp / Call*: +91 9900106474\n` +
        `✉️ *Email*: support@beevibe.org\n` +
        `⏰ *Support Hours*: 10:00 AM - 11:30 PM (7 Days a Week)\n\n` +
        `💬 Tap to chat directly with admin:\n` +
        `https://wa.me/919900106474?text=Hi%20Bee%20Vibe!%20I%20need%20assistance%20with%20a%20booking.`,
      options: [{ id: '0', text: 'Main Menu' }],
      actionLink: 'https://wa.me/919900106474?text=Hi%20Bee%20Vibe!%20I%20need%20assistance%20with%20a%20booking.',
    };
  }

  // Fallback for unknown messages
  return {
    replyText:
      `🐝 Thanks for contacting *BeeVibe*!\n\n` +
      `I didn't quite catch that. Please select an option below or reply with a number:\n\n` +
      `1️⃣ *Packages & Prices*\n` +
      `2️⃣ *Check Available Slots*\n` +
      `3️⃣ *Food & Snacks Menu*\n` +
      `4️⃣ *Venue Location*\n` +
      `5️⃣ *Contact Human Support (+919900106474)*`,
    options: [
      { id: '1', text: '1. Packages & Prices' },
      { id: '2', text: '2. Book Slot' },
      { id: '3', text: '3. Food Menu' },
      { id: '4', text: '4. Location' },
      { id: '5', text: '5. Contact Owner' },
    ],
  };
}
