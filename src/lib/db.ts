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

export interface DatabaseSchema {
  bookings: Booking[];
  timeSlots: TimeSlot[];
  otps?: OtpRecord[];
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

function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    let initialData: DatabaseSchema;
    if (IS_SERVERLESS && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        initialData = JSON.parse(bundledContent) as DatabaseSchema;
      } catch (error) {
        console.error('Error reading bundled database file, using fallback slots:', error);
        initialData = {
          bookings: [],
          timeSlots: DEFAULT_TIME_SLOTS,
        };
      }
    } else {
      initialData = {
        bookings: [],
        timeSlots: DEFAULT_TIME_SLOTS,
      };
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(fileData) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file, initializing fresh DB:', error);
    let initialData: DatabaseSchema;
    if (IS_SERVERLESS && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        initialData = JSON.parse(bundledContent) as DatabaseSchema;
      } catch (err) {
        initialData = {
          bookings: [],
          timeSlots: DEFAULT_TIME_SLOTS,
        };
      }
    } else {
      initialData = {
        bookings: [],
        timeSlots: DEFAULT_TIME_SLOTS,
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

// Helper to archive past bookings to cloud or local backup and clean active DB
export async function archivePastBookings(): Promise<{ success: boolean; count: number; destination: string; error?: string }> {
  const db = readDb();
  
  // Calculate local date (YYYY-MM-DD)
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  
  // Find bookings with date older than today
  const pastBookings = db.bookings.filter((b) => b.date < today);
  
  if (pastBookings.length === 0) {
    return { success: true, count: 0, destination: 'none' };
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
      const res = await fetch(`${cleanUrl}/rest/v1/bookings_archive`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(pastBookings),
      });
      
      if (res.ok) {
        backedUp = true;
        destination = 'supabase_db';
      } else {
        const errText = await res.text();
        console.error('Supabase backup failed:', errText);
        errorMsg = `Supabase upload error: ${errText}`;
      }
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
    let archivedList: any[] = [];
    if (fs.existsSync(archiveFile)) {
      try {
        const fileContent = fs.readFileSync(archiveFile, 'utf-8');
        archivedList = JSON.parse(fileContent);
      } catch (e) {
        console.error('Error reading archive file:', e);
      }
    }
    
    // Merge new past bookings avoiding duplicates by id
    const existingIds = new Set(archivedList.map((b) => b.id));
    const uniqueNewPast = pastBookings.filter((b) => !existingIds.has(b.id));
    archivedList.push(...uniqueNewPast);
    
    fs.writeFileSync(archiveFile, JSON.stringify(archivedList, null, 2), 'utf-8');
    
    if (!backedUp) {
      backedUp = true;
      destination = 'local_file';
    }
  } catch (e: any) {
    console.error('Local backup fallback error:', e);
    if (!backedUp) {
      return { success: false, count: 0, destination: 'none', error: e.message || 'Local backup failed' };
    }
  }
  
  if (backedUp) {
    // Remove past bookings from active DB
    db.bookings = db.bookings.filter((b) => b.date >= today);
    writeDb(db);
    return { success: true, count: pastBookings.length, destination, error: errorMsg };
  }
  
  return { success: false, count: 0, destination: 'none', error: errorMsg || 'Archiving failed' };
}
