export interface ExperiencePackage {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  price: number;
  durationHours: number;
  durationLabel: string;
  badge: string;
  color: string;
  image: string;
  details: string[];
}

export const EXPERIENCES: ExperiencePackage[] = [
  {
    id: 'pkg-red',
    name: 'Red Theme (Red Velvet Romance)',
    shortName: 'Red Velvet Romance',
    slug: 'red-theme',
    price: 799,
    durationHours: 2,
    durationLabel: '2 Hours',
    badge: 'Anniversary & Romantic Dates ❤️',
    color: '#ef4444',
    image: '/themes/theme-red.jpg',
    details: [
      'Authentic Red Velvet Decor with Floral Heart & "Will You Marry Me?" Neon',
      'Red Shimmer Sequin Wall, "LOVE" Lighted Block Boxes & Lighted Arch',
      'Plush Red Velvet Couch, Marble Table & Romantic Rose Petal Setup',
      '180" 4K Laser Projection Screen & 7.1 Dolby Atmos Sound',
      '100% Private Air Conditioned (AC) Theater Suite',
    ]
  },
  {
    id: 'pkg-pink',
    name: 'Pink Theme (Angel Wings & Neon)',
    shortName: 'Angel Wings & Neon',
    slug: 'pink-theme',
    price: 899,
    durationHours: 2,
    durationLabel: '2 Hours',
    badge: 'Trending Birthday & Party Setup 🩷',
    color: '#ec4899',
    image: '/themes/theme-pink.jpg',
    details: [
      'Giant Glowing Illuminated Angel Wings & Birthday Stage Setup',
      'Pink Shimmer Sequin Arch with "Happy Birthday" & "Let\'s Party" Neon Signs',
      'Hot Pink Plush Velvet Seating, White Marble Tables & Picket Fence',
      'Cake Cutting Cylindrical Pedestals, Golden Birdcages & Floor Fog',
      '180" 4K Laser Screen & Private Air Conditioned (AC) Suite',
    ]
  },
  {
    id: 'pkg-purple',
    name: 'Purple Theme (Royal Butterfly Grandeur)',
    shortName: 'Royal Butterfly',
    slug: 'purple-theme',
    price: 999,
    durationHours: 2,
    durationLabel: '2 Hours',
    badge: 'VIP Grand Celebration Setup 💜',
    color: '#a855f7',
    image: '/themes/theme-purple.jpg',
    details: [
      'Grand Royal Butterfly Setup with Triple Arched Lighted Canopies',
      'Lush Purple & White Balloon Arches, Floral Garlands & Gold Shimmer Wall',
      'Warm Lighted "HAPPY BIRTHDAY" Marquee Letters & Cake Stage',
      'Official BeeVibe 180" 4K Laser Screen with 7.1 Dolby Atmos Sound',
      'Royal Purple Plush Seating & 100% Private VIP Air Conditioned Suite',
    ]
  }
];

export const GAMING_EXPERIENCE = {
  id: 'pkg-gaming',
  name: 'PS5 Gaming Lounge',
  shortName: 'PS5 Gaming',
  slug: 'ps5-gaming',
  price: 399,
  durationHours: 1,
  durationLabel: 'Per Hour',
  badge: 'Dual DualSense & 180" 4K Laser Screen 🎮',
  color: '#00f0ff',
  image: '/gaming-banner.jpg',
  details: [
    'Ultra-fast PS5 console with latest top-tier titles',
    '2 Wireless DualSense Controllers with haptic feedback',
    '180" 4K Ultra HD Display & High Refresh Gaming',
    'Acoustically treated private gaming suite',
  ]
};

export const ALL_EXPERIENCES = [...EXPERIENCES, GAMING_EXPERIENCE];

export function getExperienceById(id: string) {
  return ALL_EXPERIENCES.find((exp) => exp.id === id) || EXPERIENCES[0];
}

export function getExperienceBySlug(slug: string) {
  return ALL_EXPERIENCES.find((exp) => exp.slug === slug) || EXPERIENCES[0];
}
