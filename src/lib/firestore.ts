/**
 * Firebase Admin SDK + Firestore database layer.
 * Replaces the file-based db.ts with persistent cloud storage.
 * Uses Firebase Admin SDK which is safe for server-side (Next.js API routes).
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Booking, TimeSlot, FoodOrderItem, FoodOrder, MenuItem } from './db';

export type { Booking, TimeSlot, FoodOrderItem, FoodOrder, MenuItem };

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

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '10:00 AM - 12:00 PM', label: 'Morning Show', basePrice: 999 },
  { id: 'slot-2', time: '12:30 PM - 02:30 PM', label: 'Matinee Show', basePrice: 999 },
  { id: 'slot-3', time: '03:00 PM - 05:00 PM', label: 'Afternoon Vibe', basePrice: 999 },
  { id: 'slot-4', time: '05:30 PM - 07:30 PM', label: 'Sunset Vibe', basePrice: 999 },
  { id: 'slot-5', time: '08:00 PM - 10:00 PM', label: 'Night Vibe', basePrice: 999 },
  { id: 'slot-6', time: '10:30 PM - 12:30 AM', label: 'Midnight Vibe', basePrice: 999 },
];

// Singleton admin app
let adminApp: App | null = null;
let db: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId) {
    throw new Error('FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set in environment variables.');
  }

  if (clientEmail && privateKey) {
    // Full Service Account credentials available
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fall back to Application Default Credentials (works in Google Cloud environments)
    adminApp = initializeApp({ projectId });
  }

  return adminApp;
}

export function getDb(): Firestore {
  if (db) return db;
  const databaseId = process.env.FIREBASE_ADMIN_DATABASE_ID || 'default';
  db = getFirestore(getAdminApp(), databaseId);
  return db;
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<Booking[]> {
  const firestore = getDb();
  const snapshot = await firestore.collection('bookings').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => doc.data() as Booking);
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection('bookings')
    .where('date', '==', date)
    .where('status', '!=', 'cancelled')
    .get();
  return snapshot.docs.map(doc => doc.data() as Booking);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const firestore = getDb();
  const doc = await firestore.collection('bookings').doc(id).get();
  return doc.exists ? (doc.data() as Booking) : null;
}

export async function addBookingToFirestore(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>
): Promise<Booking> {
  const firestore = getDb();

  // Generate unique ticket code: BV-YYMMDD-NNNN
  const dateParts = bookingData.date.split('-');
  const yy = dateParts[0].substring(2);
  const mm = dateParts[1];
  const dd = dateParts[2];
  const datePrefix = `BV-${yy}${mm}${dd}`;

  // Count existing bookings for this date
  const existing = await firestore
    .collection('bookings')
    .where('date', '==', bookingData.date)
    .get();
  const count = existing.size;
  const sequential = String(count + 1).padStart(4, '0');
  const bookingId = `${datePrefix}-${sequential}`;

  const newBooking: Booking = {
    ...bookingData,
    id: bookingId,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  await firestore.collection('bookings').doc(bookingId).set(newBooking);
  return newBooking;
}

export async function updateBookingStatusInFirestore(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<Booking> {
  const firestore = getDb();
  const ref = firestore.collection('bookings').doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error(`Booking with ID ${id} not found.`);
  await ref.update({ status });
  const updated = await ref.get();
  return updated.data() as Booking;
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection('bookings')
    .where('phone', '==', phone)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => doc.data() as Booking);
}

// ─── Food Orders ─────────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<FoodOrder[]> {
  const firestore = getDb();
  const snapshot = await firestore.collection('foodOrders').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => doc.data() as FoodOrder);
}

export async function addOrderToFirestore(
  orderData: Omit<FoodOrder, 'id' | 'createdAt' | 'status'>
): Promise<FoodOrder> {
  const firestore = getDb();

  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const yy = String(todayIST.getFullYear()).substring(2);
  const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
  const dd = String(todayIST.getDate()).padStart(2, '0');
  const datePrefix = `FO-${yy}${mm}${dd}`;

  const existing = await firestore
    .collection('foodOrders')
    .where('createdAt', '>=', `${todayIST.getFullYear()}-${mm}-${dd}`)
    .get();
  const count = existing.size;
  const sequential = String(count + 1).padStart(4, '0');
  const orderId = `${datePrefix}-${sequential}`;

  const newOrder: FoodOrder = {
    ...orderData,
    id: orderId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await firestore.collection('foodOrders').doc(orderId).set(newOrder);
  return newOrder;
}

export async function updateOrderStatusInFirestore(
  id: string,
  status: FoodOrder['status']
): Promise<FoodOrder> {
  const firestore = getDb();
  const ref = firestore.collection('foodOrders').doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error(`Food order with ID ${id} not found.`);
  await ref.update({ status });
  const updated = await ref.get();
  return updated.data() as FoodOrder;
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const firestore = getDb();
  const snapshot = await firestore.collection('menuItems').get();

  if (snapshot.empty) {
    // Seed with default menu items on first run
    const batch = firestore.batch();
    for (const item of DEFAULT_MENU_ITEMS) {
      const ref = firestore.collection('menuItems').doc(item.id);
      batch.set(ref, item);
    }
    await batch.commit();
    return DEFAULT_MENU_ITEMS;
  }

  return snapshot.docs.map(doc => doc.data() as MenuItem);
}

export async function addMenuItemToFirestore(
  itemData: Omit<MenuItem, 'id' | 'inStock'>
): Promise<MenuItem> {
  const firestore = getDb();
  const id = `menu-${Date.now()}`;
  const newItem: MenuItem = { ...itemData, id, inStock: true };
  await firestore.collection('menuItems').doc(id).set(newItem);
  return newItem;
}

export async function updateMenuItemInFirestore(item: MenuItem): Promise<MenuItem> {
  const firestore = getDb();
  const ref = firestore.collection('menuItems').doc(item.id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error(`Menu item with ID ${item.id} not found.`);
  await ref.set(item, { merge: true });
  return item;
}

export async function deleteMenuItemFromFirestore(id: string): Promise<void> {
  const firestore = getDb();
  await firestore.collection('menuItems').doc(id).delete();
}

// ─── Time Slots ──────────────────────────────────────────────────────────────

export async function getTimeSlots(): Promise<TimeSlot[]> {
  const firestore = getDb();
  const snapshot = await firestore.collection('timeSlots').get();

  if (snapshot.empty) {
    // Seed with defaults on first run
    const batch = firestore.batch();
    for (const slot of DEFAULT_TIME_SLOTS) {
      const ref = firestore.collection('timeSlots').doc(slot.id);
      batch.set(ref, slot);
    }
    await batch.commit();
    return DEFAULT_TIME_SLOTS;
  }

  const slots = snapshot.docs.map(doc => doc.data() as TimeSlot);
  return slots.sort((a, b) => a.id.localeCompare(b.id));
}

// ─── OTP (stored in Firestore) ───────────────────────────────────────────────

import crypto from 'crypto';

export async function saveOtpToFirestore(phone: string, otp: string, expiryMinutes = 5): Promise<void> {
  const firestore = getDb();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
  await firestore.collection('otps').doc(phone).set({ phone, hashedOtp, expiresAt });
}

export async function verifyOtpFromFirestore(phone: string, otp: string): Promise<boolean> {
  const firestore = getDb();
  const doc = await firestore.collection('otps').doc(phone).get();
  if (!doc.exists) return false;

  const record = doc.data()!;
  const now = new Date().toISOString();
  if (record.expiresAt < now) {
    await firestore.collection('otps').doc(phone).delete();
    return false;
  }

  const inputHashed = crypto.createHash('sha256').update(otp).digest('hex');
  if (record.hashedOtp === inputHashed) {
    await firestore.collection('otps').doc(phone).delete();
    return true;
  }

  return false;
}
