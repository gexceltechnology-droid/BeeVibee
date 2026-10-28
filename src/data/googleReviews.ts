/**
 * BeeVibe Google Reviews Data
 * 
 * 💡 OWNER INSTRUCTIONS:
 * You can add, edit, or paste your exact Google reviews directly into this list!
 * Each review will automatically appear on the homepage with verified Google styling.
 */

export interface GoogleReview {
  id: string;
  name: string;
  rating: number;
  timeAgo: string;
  occasion: string;
  quote: string;
  theme?: string;
  avatarColor?: string;
}

export const GOOGLE_BUSINESS_STATS = {
  rating: 4.9,
  stars: 5,
  reviewCountDisplay: '100+',
  reviewCountExact: 128,
  googleMapsUrl: 'https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8',
  writeReviewUrl: 'https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8',
  verifiedBusinessName: 'BeeVibe Private Celebration Theatre',
  location: 'Jayanagar 9th Block, Bengaluru',
};

export const GOOGLE_REVIEWS: GoogleReview[] = [
  {
    id: 'rev-1',
    name: 'Karthik & Sneha',
    rating: 5,
    timeAgo: '4 days ago',
    occasion: 'Birthday Celebration 🎂',
    theme: 'Angel Wings & Neon Room',
    avatarColor: '#2563EB',
    quote:
      'Celebrated my partner\'s birthday here last weekend. The setup was beyond expectations! The fog entry during cake cutting made it feel like a celebrity entrance. 100% private, crystal clear 4K projection, and the sound system is outstanding. Staff was super polite and attentive!',
  },
  {
    id: 'rev-2',
    name: 'Divya Ramesh',
    rating: 5,
    timeAgo: '1 week ago',
    occasion: 'Anniversary Surprise 💖',
    theme: 'Red Velvet Heart Romance',
    avatarColor: '#DC2626',
    quote:
      'Hands down the best private date spot in Jayanagar! The red velvet room with the floral heart arch and rose petal table decoration created such a romantic vibe. We plugged in our memory video easily. Felt completely private and safe. Highly recommended for couples!',
  },
  {
    id: 'rev-3',
    name: 'Rahul Kulkarni',
    rating: 5,
    timeAgo: '2 weeks ago',
    occasion: 'PS5 Gaming Night 🎮',
    theme: 'Laser Gaming Arena',
    avatarColor: '#7C3AED',
    quote:
      'Booked a 3-hour gaming session with college friends. Playing EA FC 24 and Tekken 8 on a giant 180-inch screen with 4 wireless DualSense controllers was unbelievable! The surround sound bass hits deep. Clean venue, great snacks, and super smooth booking.',
  },
  {
    id: 'rev-4',
    name: 'Meghana S.',
    rating: 5,
    timeAgo: '2 weeks ago',
    occasion: 'Bachelorette Party 🌸',
    theme: 'Royal Butterfly VIP Lounge',
    avatarColor: '#DB2777',
    quote:
      'We booked the VIP Butterfly suite for our best friend\'s bachelorette party (group of 9). Plenty of comfortable seating, breathtaking neon butterfly wings for photos, and the customized LED name board was a sweet personal touch! Everyone loved it.',
  },
  {
    id: 'rev-5',
    name: 'Abhishek Gowda',
    rating: 5,
    timeAgo: '3 weeks ago',
    occasion: 'Private Movie Night 🎬',
    theme: '4K Cinema Suite',
    avatarColor: '#059669',
    quote:
      'Far better than regular multiplexes. No strangers disturbing you, delicious warm popcorn delivered right to your seat, and you can pause or replay movies whenever you want. Logged into our OTT effortlessly. Worth every single rupee!',
  },
  {
    id: 'rev-6',
    name: 'Pooja Venkatesh',
    rating: 5,
    timeAgo: '1 month ago',
    occasion: 'Surprise Birthday 🎈',
    theme: 'Angel Wings Suite',
    avatarColor: '#D97706',
    quote:
      'The booking process was effortless and WhatsApp coordination was so prompt. The room was spotless, AC was chilled, and the surprise reveal for my sister brought tears to her eyes. Thank you BeeVibe team for making it so memorable!',
  },
];
