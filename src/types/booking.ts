export type OccasionType = 'birthday' | 'anniversary' | 'vip' | 'gaming';

export interface RoomExperience {
  id: string;
  name: string;
  theme: string;
  occasion: OccasionType;
  occasionLabel: string;
  price: number;
  duration: string;
  durationHours: number;
  capacity: string;
  maxGuests: number;
  includedGuests: number;
  extraGuestPrice: number;
  image: string;
  galleryImages: string[];
  description: string;
  features: string[];
  status: 'available' | 'few_left' | 'booked' | 'unavailable';
  badge?: string;
}

export interface OccasionItem {
  id: OccasionType;
  label: string;
  shortLabel: string;
  icon: string;
  tagline: string;
  recommendedRoomId: string;
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  category: 'cakes' | 'decor' | 'effects' | 'media' | 'food';
  icon: string;
  description: string;
  popular?: boolean;
}

export interface TimeSlotOption {
  id: string;
  time: string;
  label: string;
  basePrice: number;
  isBooked?: boolean;
}

export interface BookingState {
  date: string;
  occasion: OccasionType;
  preferredTime: string;
  roomId: string;
  timeSlot: string;
  guestCount: number;
  selectedAddOns: string[];
  cakeFlavor: string;
  ledNameText: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
  utrNumber: string;
}

export const OCCASIONS: OccasionItem[] = [
  {
    id: 'birthday',
    label: 'Birthday Celebration',
    shortLabel: 'Birthday',
    icon: '🎂',
    tagline: 'Illuminated neon wings, birthday stages & cake pedestals',
    recommendedRoomId: 'angel-wings',
  },
  {
    id: 'anniversary',
    label: 'Date / Anniversary',
    shortLabel: 'Date / Anniversary',
    icon: '❤️',
    tagline: 'Floral red heart arch, candlelit table & romantic roses',
    recommendedRoomId: 'red-velvet',
  },
  {
    id: 'vip',
    label: 'VIP Celebration',
    shortLabel: 'VIP Celebration',
    icon: '👑',
    tagline: 'Grand royal butterfly canopy, gold sequin shimmer wall',
    recommendedRoomId: 'royal-butterfly',
  },
  {
    id: 'gaming',
    label: 'PS5 Gaming Lounge',
    shortLabel: 'Gaming',
    icon: '🎮',
    tagline: 'Sony PlayStation 5 on 180" 4K display with 2 wireless controllers',
    recommendedRoomId: 'ps5-gaming',
  },
];

export const ROOMS: RoomExperience[] = [
  {
    id: 'angel-wings',
    name: 'Angel Wings & Birthday Stage',
    theme: 'Birthday Celebration Theme',
    occasion: 'birthday',
    occasionLabel: 'Birthday Celebration',
    price: 1299,
    duration: '2 Hours',
    durationHours: 2,
    capacity: 'Up to 6 Guests',
    maxGuests: 6,
    includedGuests: 2,
    extraGuestPrice: 100,
    image: '/gallery/theme-pink.jpg',
    galleryImages: [
      '/gallery/theme-pink.jpg',
      '/gallery/theme-pink-wings.jpg',
      '/gallery/theme-pink-screen.jpg',
      '/gallery/theme-pink-arch.jpg',
    ],
    description: 'Vibrant celebration suite featuring glowing illuminated angel wings, "Happy Birthday" & "Let\'s Party" neon signs, pink shimmer sequin wall, and cake pedestal stage.',
    features: [
      'Giant Glowing Illuminated Angel Wings',
      '180" 4K Laser Projection Screen',
      '7.1 Dolby Atmos Surround Sound',
      'Private Air-Conditioned Suite (100% Privacy)',
      'Dedicated Cake-Cutting Pedestal Stage',
      'All OTT Platforms (Netflix, Prime, Hotstar & YouTube)',
    ],
    status: 'available',
    badge: 'TOP PICK FOR BIRTHDAYS',
  },
  {
    id: 'red-velvet',
    name: 'Red Velvet Heart',
    theme: 'Date & Anniversary Theme',
    occasion: 'anniversary',
    occasionLabel: 'Date / Anniversary',
    price: 1099,
    duration: '2 Hours',
    durationHours: 2,
    capacity: 'Up to 3 - 4 Guests',
    maxGuests: 4,
    includedGuests: 2,
    extraGuestPrice: 100,
    image: '/gallery/theme-red.jpg',
    galleryImages: [
      '/gallery/theme-red.jpg',
      '/gallery/theme-red-screen.jpg',
      '/gallery/theme-red-heart.jpg',
      '/gallery/theme-red-couch.jpg',
    ],
    description: 'Intimate romantic suite featuring a giant red floral heart with "Will You Marry Me?" neon sign, red shimmer sequin wall, plush red velvet lounge couch (seats 3-4), LOVE lighted boxes, and 180" 4K laser cinema.',
    features: [
      'Giant Red Floral Heart with "Will You Marry Me?" Neon',
      'Plush Red Velvet Couch & Marble Coffee Table (Seats 3-4)',
      '180" 4K Laser Cinema with Dolby 7.1 Audio',
      'Stacked "LOVE" Lighted Block Boxes & Lighted Arch',
      'Dedicated Cake-Cutting Pedestal Stage & Picket Fence',
      '100% Private Air-Conditioned Suite with All OTT Streaming',
    ],
    status: 'available',
    badge: 'MOST POPULAR FOR COUPLES',
  },
  {
    id: 'royal-butterfly',
    name: 'Royal Butterfly',
    theme: 'Grand VIP Celebration Theme',
    occasion: 'vip',
    occasionLabel: 'VIP Celebration',
    price: 1499,
    duration: '2 Hours',
    durationHours: 2,
    capacity: 'Up to 10 Guests',
    maxGuests: 10,
    includedGuests: 2,
    extraGuestPrice: 100,
    image: '/gallery/theme-purple.jpg',
    galleryImages: [
      '/gallery/theme-purple.jpg',
      '/gallery/theme-purple-screen.jpg',
      '/gallery/theme-purple-movie.jpg',
      '/gallery/theme-purple-stage.jpg',
      '/gallery/theme-purple-couch.jpg',
    ],
    description: 'Our flagship VIP celebration theatre featuring triple lighted balloon canopies, illuminated butterfly wings, warm "HAPPY BIRTHDAY" marquee letters, and gold shimmer wall.',
    features: [
      'Grand Illuminated Butterfly Wings & Canopy',
      '180" 4K Laser Projection Cinema Display',
      'Dolby Atmos 7.1 Room-Calibrated Audio',
      'Spacious VIP Plush Couch (Seats up to 10)',
      'Warm "HAPPY BIRTHDAY" Marquee Letters',
      'Gold Shimmer Sequin Backdrop for Photography',
    ],
    status: 'few_left',
    badge: 'FLAGSHIP VIP THEATRE',
  },
  {
    id: 'ps5-gaming',
    name: 'PS5 Gaming Lounge',
    theme: 'Next-Gen Multiplayer Gaming',
    occasion: 'gaming',
    occasionLabel: 'Gaming',
    price: 399,
    duration: '1 Hour',
    durationHours: 1,
    capacity: 'Up to 4 Players',
    maxGuests: 4,
    includedGuests: 2,
    extraGuestPrice: 100,
    image: '/gallery/ps5-gaming.jpg',
    galleryImages: ['/gallery/ps5-gaming.jpg', '/gallery/theme-purple.jpg'],
    description: 'High-octane private gaming arena featuring 1 Sony PlayStation 5 console, 2 DualSense wireless controllers, top multiplayer AAA games, and 180" low-latency display.',
    features: [
      'Sony PlayStation 5 Console + 2 DualSense Controllers',
      '180" Low-Latency 4K Gaming Screen',
      'Top Games: EA FC 24 / FIFA, Tekken 8, Mortal Kombat 1, Spider-Man 2',
      'Dolby 7.1 Directional Surround Sound',
      '100% Private Room — Zero Queues or Distractions',
      'Open Daily Till 12 AM Midnight',
    ],
    status: 'available',
    badge: 'PS5 4K GAMING',
  },
];

export const ADD_ONS: AddOnItem[] = [
  {
    id: 'addon-cake',
    name: 'Celebration Cake (500g)',
    price: 299,
    category: 'cakes',
    icon: '🎂',
    description: 'Fresh eggless birthday / anniversary cake with candles and cake cutting set.',
    popular: true,
  },
  {
    id: 'addon-fog',
    name: 'Cinematic Cold Fog Entry',
    price: 199,
    category: 'effects',
    icon: '🌫️',
    description: 'Magical ground-hugging dry-ice cold fog rolling across the floor for grand entries & cake cutting. (Free with Coupon)',
    popular: true,
  },
  {
    id: 'addon-led',
    name: 'Custom LED Name Board',
    price: 149,
    category: 'decor',
    icon: '💡',
    description: 'Personalized glowing LED marquee letters spelling the celebration name on the main stage. (Free with Coupon)',
    popular: true,
  },
  {
    id: 'addon-decor',
    name: 'Table Decor with Rose Petals & Floor Balloons',
    price: 499,
    category: 'decor',
    icon: '🌹',
    description: 'Romantic/party table setup with fresh rose petals, 50+ premium floor balloons, and ambient decor. (Free with Coupon)',
  },
  {
    id: 'addon-snacks',
    name: 'Snack & Beverage Combo',
    price: 199,
    category: 'food',
    icon: '🍿',
    description: 'Fresh theater popcorn tub, crispy french fries, and 2 chilled beverages.',
  },
  {
    id: 'addon-dslr',
    name: 'DSLR Pro Photography (30 Mins)',
    price: 499,
    category: 'media',
    icon: '📸',
    description: 'Dedicated photographer shooting 25+ edited high-resolution celebration photos.',
  },
];
