/**
 * Firebase Admin SDK + Firestore database layer with seamless Local DB fallback.
 * If Firestore is not provisioned or encounters a transient error, it gracefully
 * falls back to the persistent local database without failing customer bookings.
 */

import crypto from 'crypto';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Booking, TimeSlot, FoodOrderItem, FoodOrder, MenuItem } from './db';
import {
  readDb,
  addBooking as addBookingLocal,
  updateBookingStatus as updateBookingStatusLocal,
  addFoodOrder as addFoodOrderLocal,
  updateFoodOrderStatus as updateFoodOrderStatusLocal,
  addMenuItem as addMenuItemLocal,
  updateMenuItem as updateMenuItemLocal,
  deleteMenuItem as deleteMenuItemLocal,
  saveOtp as saveOtpLocal,
  verifyOtp as verifyOtpLocal,
} from './db';

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
  { id: 'slot-6', time: '10:00 PM - 12:00 AM', label: 'Midnight Vibe', basePrice: 999 },
];

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
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey?.replace(/\\n/g, '\n');

  if (!projectId) {
    throw new Error('FIREBASE_ADMIN_PROJECT_ID is not set in environment variables.');
  }

  if (clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = initializeApp({ projectId });
  }

  return adminApp;
}

export function getDb(): Firestore {
  if (db) return db;
  const app = getAdminApp();
  const databaseId = process.env.FIREBASE_DATABASE_ID || 'default';
  try {
    db = getFirestore(app, databaseId);
  } catch {
    db = getFirestore(app);
  }
  return db;
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore.collection('bookings').orderBy('createdAt', 'desc').get();
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Booking);
    }
  } catch (err) {
    // fallback
  }
  const local = readDb();
  return local.bookings || [];
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore
      .collection('bookings')
      .where('date', '==', date)
      .where('status', '!=', 'cancelled')
      .get();
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Booking);
    }
  } catch (err) {
    // fallback
  }
  const local = readDb();
  return (local.bookings || []).filter(b => b.date === date && b.status !== 'cancelled');
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const cleanId = id.trim();
  try {
    const firestore = getDb();
    const doc = await firestore.collection('bookings').doc(cleanId).get();
    if (doc.exists) return doc.data() as Booking;

    // Try case-insensitive search in firestore
    const all = await firestore.collection('bookings').get();
    const found = all.docs.find(d => d.id.toLowerCase() === cleanId.toLowerCase());
    if (found) return found.data() as Booking;
  } catch (err) {
    // fallback
  }

  const local = readDb();
  return (local.bookings || []).find(b => b.id.toLowerCase() === cleanId.toLowerCase()) || null;
}

export async function addBookingToFirestore(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>
): Promise<Booking> {
  const dateParts = bookingData.date.split('-');
  const yy = dateParts[0].substring(2);
  const mm = dateParts[1];
  const dd = dateParts[2];
  const datePrefix = `BV-${yy}${mm}${dd}`;

  try {
    const firestore = getDb();
    const existing = await firestore
      .collection('bookings')
      .where('date', '==', bookingData.date)
      .get();
    const count = existing.size;
    const sequential = String(count + 1).padStart(4, '0');
    const bookingId = `${datePrefix}-${sequential}`;

    const advancePaid = typeof bookingData.advancePaid === 'number' ? bookingData.advancePaid : Math.min(500, bookingData.totalPrice);
    const balanceDue = typeof bookingData.balanceDue === 'number' ? bookingData.balanceDue : Math.max(0, bookingData.totalPrice - advancePaid);
    const paymentStatus = bookingData.paymentStatus || (balanceDue === 0 ? 'fully_paid' : 'advance_paid');
    const paymentMode = bookingData.paymentMode || 'UPI (8123635342@sbi)';
    const utrNumber = (bookingData as any).utrNumber || '';

    const newBooking: Booking = {
      ...bookingData,
      id: bookingId,
      advancePaid,
      balanceDue,
      paymentStatus,
      paymentMode,
      utrNumber,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    await firestore.collection('bookings').doc(bookingId).set(newBooking);
    return newBooking;
  } catch (err) {
    console.warn('[Firestore] addBookingToFirestore fallback to local:', (err as Error).message);
    const localBooking = addBookingLocal(bookingData);
    return localBooking;
  }
}

export async function updateBookingStatusInFirestore(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<Booking> {
  try {
    const firestore = getDb();
    const ref = firestore.collection('bookings').doc(id);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ status });
      const updated = await ref.get();
      return updated.data() as Booking;
    }
  } catch (err) {
    // fallback
  }
  const localUpdated = updateBookingStatusLocal(id, status);
  if (!localUpdated) throw new Error(`Booking with ID ${id} not found.`);
  return localUpdated;
}

export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore
      .collection('bookings')
      .where('phone', '==', phone)
      .orderBy('createdAt', 'desc')
      .get();
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as Booking);
    }
  } catch (err) {
    // fallback
  }
  const local = readDb();
  return (local.bookings || []).filter(b => b.phone === phone);
}

// ─── Food Orders ─────────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<FoodOrder[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore.collection('foodOrders').orderBy('createdAt', 'desc').get();
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as FoodOrder);
    }
  } catch (err) {
    // fallback
  }
  const local = readDb();
  return local.foodOrders || [];
}

export async function addOrderToFirestore(
  orderData: Omit<FoodOrder, 'id' | 'createdAt' | 'status'>
): Promise<FoodOrder> {
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const yy = String(todayIST.getFullYear()).substring(2);
  const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
  const dd = String(todayIST.getDate()).padStart(2, '0');
  const datePrefix = `FO-${yy}${mm}${dd}`;

  try {
    const firestore = getDb();
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
  } catch (err) {
    console.warn('[Firestore] addOrderToFirestore fallback to local:', (err as Error).message);
    return addFoodOrderLocal(orderData);
  }
}

export async function updateOrderStatusInFirestore(
  id: string,
  status: FoodOrder['status']
): Promise<FoodOrder> {
  try {
    const firestore = getDb();
    const ref = firestore.collection('foodOrders').doc(id);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ status });
      const updated = await ref.get();
      return updated.data() as FoodOrder;
    }
  } catch (err) {
    // fallback
  }
  const updated = updateFoodOrderStatusLocal(id, status);
  if (!updated) throw new Error(`Food order with ID ${id} not found.`);
  return updated;
}

// ─── Menu Items ──────────────────────────────────────────────────────────────

export async function getAllMenuItems(): Promise<MenuItem[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore.collection('menuItems').get();
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as MenuItem);
    }
  } catch (err) {
    // fallback
  }
  const local = readDb();
  return local.menuItems || DEFAULT_MENU_ITEMS;
}

export async function addMenuItemToFirestore(
  itemData: Omit<MenuItem, 'id' | 'inStock'>
): Promise<MenuItem> {
  try {
    const firestore = getDb();
    const id = `menu-${Date.now()}`;
    const newItem: MenuItem = { ...itemData, id, inStock: true };
    await firestore.collection('menuItems').doc(id).set(newItem);
    return newItem;
  } catch (err) {
    return addMenuItemLocal(itemData);
  }
}

export async function updateMenuItemInFirestore(item: MenuItem): Promise<MenuItem> {
  try {
    const firestore = getDb();
    const ref = firestore.collection('menuItems').doc(item.id);
    await ref.set(item, { merge: true });
    return item;
  } catch (err) {
    return updateMenuItemLocal(item);
  }
}

export async function deleteMenuItemFromFirestore(id: string): Promise<void> {
  try {
    const firestore = getDb();
    await firestore.collection('menuItems').doc(id).delete();
  } catch (err) {
    deleteMenuItemLocal(id);
  }
}

// ─── Time Slots ──────────────────────────────────────────────────────────────

export async function getTimeSlots(): Promise<TimeSlot[]> {
  try {
    const firestore = getDb();
    const snapshot = await firestore.collection('timeSlots').get();
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as TimeSlot);
    }
  } catch (err) {
    // fallback
  }
  const local = readDb();
  return local.timeSlots || DEFAULT_TIME_SLOTS;
}

// ─── OTP Operations ─────────────────────────────────────────────────────────

export async function saveOtpToFirestore(phone: string, code: string, expiryMinutes = 5): Promise<void> {
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  try {
    const firestore = getDb();
    await firestore.collection('otps').doc(phone).set({
      phone,
      hashedOtp: hash,
      expiresAt,
    });
  } catch (err) {
    saveOtpLocal(phone, code, expiryMinutes);
  }
}

export async function verifyOtpFromFirestore(phone: string, code: string): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const now = new Date().toISOString();

  try {
    const firestore = getDb();
    const doc = await firestore.collection('otps').doc(phone).get();
    if (doc.exists) {
      const data = doc.data() as { hashedOtp: string; expiresAt: string };
      if (data.hashedOtp === hash && data.expiresAt > now) {
        await firestore.collection('otps').doc(phone).delete();
        return true;
      }
    }
  } catch (err) {
    // fallback
  }

  return verifyOtpLocal(phone, code);
}

export async function updateBookingPaymentVerificationInFirestore(
  id: string,
  updates: { sbiVerified?: boolean; balanceCollected?: boolean; adminNotes?: string; status?: 'pending' | 'confirmed' | 'cancelled' }
): Promise<Booking> {
  const cleanId = id.trim();
  try {
    const firestore = getDb();
    const updatePayload: Record<string, any> = {};
    if (updates.sbiVerified !== undefined) updatePayload.sbiVerified = updates.sbiVerified;
    if (updates.balanceCollected !== undefined) {
      updatePayload.balanceCollected = updates.balanceCollected;
      if (updates.balanceCollected) updatePayload.paymentStatus = 'fully_paid';
    }
    if (updates.adminNotes !== undefined) updatePayload.adminNotes = updates.adminNotes;
    if (updates.status !== undefined) updatePayload.status = updates.status;

    await firestore.collection('bookings').doc(cleanId).set(updatePayload, { merge: true });
    const updatedDoc = await firestore.collection('bookings').doc(cleanId).get();
    if (updatedDoc.exists) {
      return updatedDoc.data() as Booking;
    }
  } catch (err) {
    console.warn('Firestore update failed, falling back to local DB:', err);
  }

  const { updateBookingPaymentVerification } = await import('./db');
  return updateBookingPaymentVerification(cleanId, updates);
}
