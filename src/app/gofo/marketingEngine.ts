/**
 * Multi-Tenant White-Labeled WhatsApp Marketing & Automation Engine
 */

export interface CampaignTemplate {
  id: string;
  title: string;
  icon: string;
  description: string;
  templateText: string;
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'birthday_voucher',
    title: '🎂 Birthday & Anniversary Voucher',
    icon: '🎉',
    description: 'Personalized warm birthday greeting with an exclusive ₹200 discount voucher.',
    templateText: `Hi {{customer_name}}! 🎂✨\n\nTeam *{{business_name}}* wishes you a very Happy Birthday! 🥳 May your year ahead be filled with joy and wonderful memories!\n\nTo make your celebration extra special, here is an exclusive birthday gift for you:\n🎁 *Flat ₹200 OFF* on your next private theater or gaming celebration!\n\nUse Code: *VIBE200* when booking online:\n🔗 {{booking_link}}\n\nWe look forward to hosting your special day! 🎬🍿`,
  },
  {
    id: 'review_request',
    title: '⭐ 5-Star Google Review Request',
    icon: '🌟',
    description: 'Post-celebration feedback and 5-star Google review booster.',
    templateText: `Hi {{customer_name}}! 👋\n\nThank you for celebrating with us at *{{business_name}}*! 🐝 We hope you and your guests had a magical experience!\n\nIf you enjoyed your time with us, could you please take 30 seconds to share your feedback and leave us a 5-star Google rating? It means the world to our team! 💖\n\n⭐ *Leave a Review Here:*\n{{google_review_link}}\n\nThank you so much, and hope to see you again soon! 🎬✨`,
  },
  {
    id: 'we_miss_you',
    title: '🍿 "We Miss You" Re-Engagement Offer',
    icon: '🍿',
    description: 'Re-engage past guests with complimentary theater snacks & drinks.',
    templateText: `Hi {{customer_name}}! 😊\n\nWe haven't seen you in a while at *{{business_name}}*! We've added new decor enhancements, immersive sound upgrades, and delicious new menu snacks!\n\nPlan your next movie night or PS5 gaming session with friends this week, and your first *Popcorn & Snack Platter is on the house!* 🍿🥤\n\nCheck available slots here:\n🔗 {{booking_link}}\n\nSee you soon! 🎬✨`,
  },
  {
    id: 'new_theme_announcement',
    title: '📢 New Themes & Amenities Announcement',
    icon: '✨',
    description: 'Announce newly launched themed setups, lighting, and PS5 gaming titles.',
    templateText: `Hi {{customer_name}}! 🎬✨\n\nExciting news from *{{business_name}}*!\n\nWe have officially refreshed our private celebration theaters with all-new setups:\n🌹 *Red Velvet Romance Room*\n🪽 *Rose Pink Angel Wings & Neon Room*\n🦋 *Royal Butterfly Grandeur Room*\n🎮 *PS5 Dark Knight Gaming Lounge*\n\nBook your private show for birthdays, anniversaries, or gaming nights:\n🔗 {{booking_link}}\n\nHave a fantastic day! 🐝`,
  }
];

export class MarketingEngine {
  /**
   * Render personalized WhatsApp message with dynamic merchant and customer variables
   */
  static renderMessage(
    templateText: string,
    variables: {
      customerName: string;
      businessName: string;
      bookingLink?: string;
      googleReviewLink?: string;
      offerCode?: string;
    }
  ): string {
    let result = templateText;
    result = result.replace(/\{\{customer_name\}\}/g, variables.customerName || 'Guest');
    result = result.replace(/\{\{business_name\}\}/g, variables.businessName || 'Bee Vibe Bangalore');
    result = result.replace(/\{\{booking_link\}\}/g, variables.bookingLink || 'https://www.beevibe.org/book');
    result = result.replace(/\{\{google_review_link\}\}/g, variables.googleReviewLink || 'https://g.page/r/beevibe/review');
    result = result.replace(/\{\{offer_code\}\}/g, variables.offerCode || 'VIBE200');
    return result;
  }

  /**
   * Generate direct WhatsApp click-to-chat URL
   */
  static generateWhatsAppUrl(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  }
}
