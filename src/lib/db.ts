import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { checkBookingOverlap } from './time';

export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM - 01:00 PM"
  packageName: string;
  addOns: string[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  guestCount: number;
  specialRequests?: string;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  basePrice: number;
}

export interface OtpRecord {
  phone: string;
  hashedOtp: string;
  expiresAt: string;
}

export interface FoodOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FoodOrder {
  id: string;
  theme: 'pink' | 'purple' | 'red';
  themeLabel: string;
  customerName?: string;
  phone?: string;
  items: FoodOrderItem[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'served' | 'cancelled';
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'snacks' | 'beverages' | 'desserts';
  inStock: boolean;
  icon: string;
}

export interface DatabaseSchema {
  bookings: Booking[];
  timeSlots: TimeSlot[];
  otps?: OtpRecord[];
  foodOrders?: FoodOrder[];
  menuItems?: MenuItem[];
}

const IS_SERVERLESS = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'db.json');

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '10:00 AM - 12:00 PM', label: 'Morning Show', basePrice: 999 },
  { id: 'slot-2', time: '12:30 PM - 02:30 PM', label: 'Matinee Show', basePrice: 999 },
  { id: 'slot-3', time: '03:00 PM - 05:00 PM', label: 'Afternoon Vibe', basePrice: 999 },
  { id: 'slot-4', time: '05:30 PM - 07:30 PM', label: 'Sunset Vibe', basePrice: 999 },
  { id: 'slot-5', time: '08:00 PM - 10:00 PM', label: 'Night Vibe', basePrice: 999 },
  { id: 'slot-6', time: '10:30 PM - 12:30 AM', label: 'Midnight Vibe', basePrice: 999 },
];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'menu-1', name: 'Maggie', price: 70, description: 'Hot and delicious instant noodles.', category: 'snacks', inStock: true, icon: '🍜' },
  { id: 'menu-2', name: 'Cool drinks', price: 40, description: 'Chilled carbonated beverages (per glass).', category: 'beverages', inStock: true, icon: '🥤' },
  { id: 'menu-3', name: 'Popcorn', price: 100, description: 'Freshly popped warm theater style popcorn.', category: 'snacks', inStock: true, icon: '🍿' },
  { id: 'menu-4', name: 'French fries', price: 100, description: 'Golden-fried crispy potato strips.', category: 'snacks', inStock: true, icon: '🍟' },
  { id: 'menu-5', name: 'Veg nuggets', price: 70, description: 'Crispy deep-fried vegetables bites.', category: 'snacks', inStock: true, icon: '🧆' },
  { id: 'menu-6', name: 'Chicken nuggets', price: 100, description: 'Crispy fried chicken breast bites.', category: 'snacks', inStock: true, icon: '🍗' },
  { id: 'menu-7', name: 'Nachos', price: 100, description: 'Crunchy tortilla chips with cheese dipping sauce.', category: 'snacks', inStock: true, icon: '🌮' },
  { id: 'menu-8', name: 'Sweet corn', price: 70, description: 'Steamed butter sweet corn.', category: 'snacks', inStock: true, icon: '🌽' },
  { id: 'menu-9', name: 'Burger', price: 100, description: 'Delicious patty burger with cheese and fresh sauces.', category: 'snacks', inStock: true, icon: '🍔' },
  { id: 'menu-10', name: 'Tea & Coffee', price: 20, description: 'Warm and refreshing hot brews.', category: 'beverages', inStock: true, icon: '☕' },
  { id: 'menu-11', name: 'Onion rings', price: 150, description: 'Crispy fried batter-coated onion rings.', category: 'snacks', inStock: true, icon: '🧅' },
  { id: 'menu-12', name: 'Ice cream', price: 40, description: 'Scoop of delicious cold ice cream.', category: 'desserts', inStock: true, icon: '🍨' }
];

function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  let initialData: DatabaseSchema;
  if (!fs.existsSync(DB_FILE)) {
    if (IS_SERVERLESS && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        initialData = JSON.parse(bundledContent) as DatabaseSchema;
      } catch (error) {
        console.error('Error reading bundled database file, using fallback slots:', error);
        initialData = {
          bookings: [],
          timeSlots: DEFAULT_TIME_SLOTS,
          menuItems: DEFAULT_MENU_ITEMS,
        };
      }
    } else {
      initialData = {
        bookings: [],
        timeSlots: DEFAULT_TIME_SLOTS,
        menuItems: DEFAULT_MENU_ITEMS,
      };
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(fileData) as DatabaseSchema;
    let modified = false;
    if (!parsed.menuItems || parsed.menuItems.length === 0) {
      parsed.menuItems = DEFAULT_MENU_ITEMS;
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (error) {
    console.error('Error reading database file, initializing fresh DB:', error);
    if (IS_SERVERLESS && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        initialData = JSON.parse(bundledContent) as DatabaseSchema;
      } catch (err) {
        initialData = {
          bookings: [],
          timeSlots: DEFAULT_TIME_SLOTS,
          menuItems: DEFAULT_MENU_ITEMS,
        };
      }
    } else {
      initialData = {
        bookings: [],
        timeSlots: DEFAULT_TIME_SLOTS,
        menuItems: DEFAULT_MENU_ITEMS,
      };
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export function readDb(): DatabaseSchema {
  return initDb();
}

export function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to get bookings for a specific date
export function getBookingsByDate(date: string): Booking[] {
  const db = readDb();
  return db.bookings.filter((b) => b.date === date && b.status !== 'cancelled');
}

// Helper to add a new booking
export function addBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
  const db = readDb();
  
  // Double-booking check using overlap logic
  const isBooked = checkBookingOverlap(bookingData.date, bookingData.timeSlot, db.bookings);

  if (isBooked) {
    throw new Error('This time slot overlaps with an existing booking.');
  }

  // Generate unique sequential ticket code: BV-YYMMDD-NNNN
  const dateParts = bookingData.date.split('-');
  const yy = dateParts[0].substring(2);
  const mm = dateParts[1];
  const dd = dateParts[2];
  const datePrefix = `BV-${yy}${mm}${dd}`;

  // Count existing bookings for this date to determine sequence index
  const count = db.bookings.filter((b) => b.id.startsWith(datePrefix)).length;
  const sequential = String(count + 1).padStart(4, '0');
  const bookingId = `${datePrefix}-${sequential}`;

  const newBooking: Booking = {
    ...bookingData,
    id: bookingId,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  db.bookings.push(newBooking);
  writeDb(db);
  return newBooking;
}

// Helper to update a booking's status
export function updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Booking {
  const db = readDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error(`Booking with ID ${id} not found.`);
  }
  
  db.bookings[index].status = status;
  writeDb(db);
  return db.bookings[index];
}

// Helper to save OTP to database with hashing and expiry
export function saveOtp(phone: string, otp: string, expiryMinutes: number = 5): void {
  const db = readDb();
  if (!db.otps) {
    db.otps = [];
  }

  // Clean up any existing OTPs for the same phone
  db.otps = db.otps.filter((item) => item.phone !== phone);

  // Hash the OTP code using SHA-256
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  db.otps.push({
    phone,
    hashedOtp,
    expiresAt,
  });

  writeDb(db);
}

// Helper to verify OTP and return success/failure
export function verifyOtp(phone: string, otp: string): boolean {
  const db = readDb();
  if (!db.otps) {
    return false;
  }

  // Clean up expired OTPs while reading
  const now = new Date().toISOString();
  db.otps = db.otps.filter((item) => item.expiresAt > now);

  const recordIndex = db.otps.findIndex((item) => item.phone === phone);
  if (recordIndex === -1) {
    writeDb(db);
    return false;
  }

  const record = db.otps[recordIndex];
  const inputHashed = crypto.createHash('sha256').update(otp).digest('hex');

  if (record.hashedOtp === inputHashed) {
    // Delete OTP once verified successfully
    db.otps.splice(recordIndex, 1);
    writeDb(db);
    return true;
  }

  writeDb(db);
  return false;
}

// Helper to archive past bookings and food orders to cloud or local backup and clean active DB
export async function archivePastBookings(): Promise<{ success: boolean; count: number; ordersCount: number; destination: string; error?: string }> {
  const db = readDb();
  
  // Calculate local date (YYYY-MM-DD)
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  
  // Find bookings with date older than today
  const pastBookings = db.bookings.filter((b) => b.date < today);
  
  // Find food orders created on dates older than today
  const foodOrders = db.foodOrders || [];
  const pastFoodOrders = foodOrders.filter((o) => {
    const orderDate = o.createdAt ? o.createdAt.slice(0, 10) : '';
    return orderDate !== '' && orderDate < today;
  });

  if (pastBookings.length === 0 && pastFoodOrders.length === 0) {
    return { success: true, count: 0, ordersCount: 0, destination: 'none' };
  }
  
  let backedUp = false;
  let destination = 'local_file';
  let errorMsg: string | undefined;
  
  // 1. Try Supabase Rest API if keys exist
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/$/, '');
      if (pastBookings.length > 0) {
        await fetch(`${cleanUrl}/rest/v1/bookings_archive`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(pastBookings),
        });
      }
      if (pastFoodOrders.length > 0) {
        await fetch(`${cleanUrl}/rest/v1/food_orders_archive`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(pastFoodOrders),
        });
      }
      backedUp = true;
      destination = 'supabase_db';
    } catch (e: any) {
      console.error('Error uploading to Supabase:', e);
      errorMsg = e.message || 'Supabase connection error';
    }
  }
  
  // 2. Try Generic Webhook / Backup URL if configured and not backed up yet
  const backupUrl = process.env.CLOUD_BACKUP_URL;
  if (!backedUp && backupUrl) {
    try {
      const res = await fetch(backupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookings: pastBookings,
          foodOrders: pastFoodOrders,
          archivedAt: new Date().toISOString(),
        }),
      });
      
      if (res.ok) {
        backedUp = true;
        destination = 'cloud_webhook';
      } else {
        const errText = await res.text();
        console.error('Cloud webhook backup failed:', errText);
        errorMsg = `Webhook upload error: ${errText}`;
      }
    } catch (e: any) {
      console.error('Error uploading to cloud backup webhook:', e);
      errorMsg = e.message || 'Webhook connection error';
    }
  }
  
  // 3. Local File Backup Fallback (Always run as fallback or primary if no keys)
  try {
    const archiveFile = path.join(DB_DIR, 'archive_db.json');
    let archiveData: { bookings?: any[]; foodOrders?: any[] } = {};
    if (fs.existsSync(archiveFile)) {
      try {
        const fileContent = fs.readFileSync(archiveFile, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          archiveData = { bookings: parsed, foodOrders: [] };
        } else {
          archiveData = parsed;
        }
      } catch (e) {
        console.error('Error reading archive file:', e);
      }
    }
    
    if (!archiveData.bookings) archiveData.bookings = [];
    if (!archiveData.foodOrders) archiveData.foodOrders = [];
    
    // Merge new past bookings and food orders avoiding duplicates by id
    const existingBookingIds = new Set(archiveData.bookings.map((b) => b.id));
    const uniqueNewPastBookings = pastBookings.filter((b) => !existingBookingIds.has(b.id));
    archiveData.bookings.push(...uniqueNewPastBookings);

    const existingOrderIds = new Set(archiveData.foodOrders.map((o) => o.id));
    const uniqueNewPastOrders = pastFoodOrders.filter((o) => !existingOrderIds.has(o.id));
    archiveData.foodOrders.push(...uniqueNewPastOrders);
    
    fs.writeFileSync(archiveFile, JSON.stringify(archiveData, null, 2), 'utf-8');
    
    if (!backedUp) {
      backedUp = true;
      destination = 'local_file';
    }
  } catch (e: any) {
    console.error('Local backup fallback error:', e);
    if (!backedUp) {
      return { success: false, count: 0, ordersCount: 0, destination: 'none', error: e.message || 'Local backup failed' };
    }
  }
  
  if (backedUp) {
    // Remove past bookings and past food orders from active DB
    db.bookings = db.bookings.filter((b) => b.date >= today);
    if (db.foodOrders) {
      db.foodOrders = db.foodOrders.filter((o) => {
        const orderDate = o.createdAt ? o.createdAt.slice(0, 10) : '';
        return orderDate === '' || orderDate >= today;
      });
    }
    writeDb(db);
    return { success: true, count: pastBookings.length, ordersCount: pastFoodOrders.length, destination, error: errorMsg };
  }
  
  return { success: false, count: 0, ordersCount: 0, destination: 'none', error: errorMsg || 'Archiving failed' };
}

// Helper to add a new food order
export function addFoodOrder(orderData: Omit<FoodOrder, 'id' | 'createdAt' | 'status'>): FoodOrder {
  const db = readDb();
  if (!db.foodOrders) {
    db.foodOrders = [];
  }

  // Get current date string in YYYY-MM-DD for ID prefix (Asia/Kolkata timezone or local)
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const yy = String(todayIST.getFullYear()).substring(2);
  const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
  const dd = String(todayIST.getDate()).padStart(2, '0');
  const datePrefix = `FO-${yy}${mm}${dd}`;

  // Count existing orders for this prefix to determine sequence index
  const count = db.foodOrders.filter((o) => o.id.startsWith(datePrefix)).length;
  const sequential = String(count + 1).padStart(4, '0');
  const orderId = `${datePrefix}-${sequential}`;

  const newOrder: FoodOrder = {
    ...orderData,
    id: orderId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.foodOrders.push(newOrder);
  writeDb(db);
  return newOrder;
}

// Helper to update a food order's status
export function updateFoodOrderStatus(id: string, status: FoodOrder['status']): FoodOrder {
  const db = readDb();
  if (!db.foodOrders) {
    throw new Error('No food orders found in database.');
  }

  const index = db.foodOrders.findIndex((o) => o.id === id);
  if (index === -1) {
    throw new Error(`Food order with ID ${id} not found.`);
  }

  db.foodOrders[index].status = status;
  writeDb(db);
  return db.foodOrders[index];
}

// Helper to add a new menu item
export function addMenuItem(itemData: Omit<MenuItem, 'id' | 'inStock'>): MenuItem {
  const db = readDb();
  if (!db.menuItems) {
    db.menuItems = [];
  }

  // Generate unique ID, e.g. menu-1784525895
  const timestamp = Date.now();
  const id = `menu-${timestamp}`;

  const newItem: MenuItem = {
    ...itemData,
    id,
    inStock: true
  };

  db.menuItems.push(newItem);
  writeDb(db);
  return newItem;
}

// Helper to update an existing menu item
export function updateMenuItem(itemData: MenuItem): MenuItem {
  const db = readDb();
  if (!db.menuItems) {
    db.menuItems = [];
  }

  const index = db.menuItems.findIndex((item) => item.id === itemData.id);
  if (index === -1) {
    throw new Error(`Menu item with ID ${itemData.id} not found.`);
  }

  db.menuItems[index] = {
    ...db.menuItems[index],
    ...itemData
  };

  writeDb(db);
  return db.menuItems[index];
}

// Helper to delete a menu item
export function deleteMenuItem(id: string): void {
  const db = readDb();
  if (!db.menuItems) {
    return;
  }

  db.menuItems = db.menuItems.filter((item) => item.id !== id);
  writeDb(db);
}


