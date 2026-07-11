import fs from 'fs';
import path from 'path';

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

export interface DatabaseSchema {
  bookings: Booking[];
  timeSlots: TimeSlot[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '10:00 AM - 12:00 PM', label: 'Morning Show', basePrice: 999 },
  { id: 'slot-2', time: '12:30 PM - 02:30 PM', label: 'Matinee Show', basePrice: 999 },
  { id: 'slot-3', time: '03:00 PM - 05:00 PM', label: 'Afternoon Vibe', basePrice: 999 },
  { id: 'slot-4', time: '05:30 PM - 07:30 PM', label: 'Sunset Vibe', basePrice: 999 },
  { id: 'slot-5', time: '08:00 PM - 10:00 PM', label: 'Night Vibe', basePrice: 999 },
  { id: 'slot-6', time: '10:30 PM - 12:30 AM', label: 'Midnight Vibe', basePrice: 999 },
];

function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      bookings: [],
      timeSlots: DEFAULT_TIME_SLOTS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(fileData) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file, initializing fresh DB:', error);
    const initialData: DatabaseSchema = {
      bookings: [],
      timeSlots: DEFAULT_TIME_SLOTS,
    };
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
  
  // Double-booking check
  const isBooked = db.bookings.some(
    (b) => b.date === bookingData.date && b.timeSlot === bookingData.timeSlot && b.status !== 'cancelled'
  );

  if (isBooked) {
    throw new Error('This time slot is already booked for the selected date.');
  }

  const newBooking: Booking = {
    ...bookingData,
    id: 'BEE-' + Math.floor(100000 + Math.random() * 900000), // e.g. BEE-182736
    status: 'pending',
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
