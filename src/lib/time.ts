/**
 * Operating Hours Constants for Bee Vibe
 * Opening: 10:00 AM (600 minutes)
 * Closing: 12:00 AM Midnight (1440 minutes) - Strict hard stop!
 */
export const VENUE_OPEN_MINUTES = 600; // 10:00 AM
export const VENUE_CLOSE_MINUTES = 1440; // 12:00 AM Midnight

/**
 * Converts 12-hour components (1-12, 0-59, AM/PM) into minutes from midnight (0 to 1439).
 */
export function convert12HourToMinutes(hour12: number, minute: number, ampm: 'AM' | 'PM'): number {
  let hours = hour12 % 12;
  if (ampm === 'PM') {
    hours += 12;
  }
  return hours * 60 + minute;
}

/**
 * Converts minutes from midnight into 12-hour components.
 */
export function convertMinutesTo12Hour(minutes: number): { hour12: number; minute: number; ampm: 'AM' | 'PM' } {
  const normalized = minutes % 1440;
  let hours = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const ampm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, ampm };
}

/**
 * Validates that a candidate time range is strictly within Bee Vibe operating hours (10:00 AM to 12:00 AM midnight).
 */
export function validateSlotOperatingHours(startMinutes: number, endMinutes: number): { valid: boolean; error?: string } {
  if (startMinutes < VENUE_OPEN_MINUTES) {
    return {
      valid: false,
      error: 'Bee Vibe opens at 10:00 AM. Please select a start time from 10:00 AM onwards.',
    };
  }
  if (endMinutes > VENUE_CLOSE_MINUTES) {
    return {
      valid: false,
      error: 'Bee Vibe closes at 12:00 AM Midnight. Bookings cannot extend past 12:00 AM.',
    };
  }
  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      error: 'End time must be after start time.',
    };
  }
  return { valid: true };
}

/**
 * Parses a time string (e.g. 10:00 AM, 12:30 PM, 10:30 PM, 12:00 AM, 14:30)
 * into minutes from the start of the day (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  const cleanStr = timeStr.trim().toUpperCase();

  // Format check for AM/PM (e.g. 10:00 AM or 02:30 PM)
  const ampmMatch = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3];

    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  // Format check for 24h military time (e.g. 14:30)
  const militaryMatch = cleanStr.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    return hours * 60 + minutes;
  }

  throw new Error('Invalid time format: ' + timeStr);
}

/**
 * Parses a time range string (e.g., 10:00 AM - 12:00 PM) into start and end minutes.
 * Handles crossing midnight by adding 1440 minutes (24 hours) to endMinutes if it falls before startMinutes.
 */
export function parseTimeRange(timeRangeStr: string): { startMinutes: number; endMinutes: number } {
  const parts = timeRangeStr.split(/[-–—]/);
  if (parts.length !== 2) {
    throw new Error('Invalid time range format: ' + timeRangeStr);
  }

  const startMinutes = parseTimeToMinutes(parts[0]);
  let endMinutes = parseTimeToMinutes(parts[1]);

  // If the end time is less than or equal to start time, it crosses midnight.
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return { startMinutes, endMinutes };
}

/**
 * Formats minutes from midnight to a 12-hour AM/PM string (e.g., 660 -> 11:00 AM, 1440 -> 12:00 AM).
 */
export function formatMinutesToTimeStr(minutes: number): string {
  if (minutes === 1440) return '12:00 AM';
  const normalizedMinutes = minutes % 1440;
  let hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const minsStr = mins.toString().padStart(2, '0');
  const hoursStr = hours.toString().padStart(2, '0');

  return hoursStr + ':' + minsStr + ' ' + ampm;
}

/**
 * Formats start and end minutes to a time range string (e.g., 10:00 AM - 12:00 PM).
 */
export function formatCustomTimeRange(startMinutes: number, endMinutes: number): string {
  const startStr = formatMinutesToTimeStr(startMinutes);
  const endStr = formatMinutesToTimeStr(endMinutes);
  return startStr + ' - ' + endStr;
}

/**
 * Offset a date string YYYY-MM-DD by a number of days.
 * Timezone-safe using UTC calculation.
 */
export function getRelativeDateStr(dateStr: string, offsetDays: number): string {
  const parts = dateStr.split('-');
  const yr = parseInt(parts[0], 10);
  const mo = parseInt(parts[1], 10) - 1;
  const dy = parseInt(parts[2], 10);
  const d = new Date(Date.UTC(yr, mo, dy));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Translate a booking's time slot into start and end minutes relative to the targetDate.
 */
export function getIntervalRelativeToDay(
  bookingDateStr: string,
  timeSlotStr: string,
  targetDateStr: string
): { start: number; end: number } | null {
  try {
    const bookingTime = new Date(bookingDateStr).getTime();
    const targetTime = new Date(targetDateStr).getTime();
    const diffDays = Math.round((bookingTime - targetTime) / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) > 1) {
      return null;
    }

    const { startMinutes, endMinutes } = parseTimeRange(timeSlotStr);
    const offset = diffDays * 1440;
    return {
      start: startMinutes + offset,
      end: endMinutes + offset,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if two intervals overlap.
 */
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Checks if a candidate time slot overlaps with any active bookings.
 */
export function checkBookingOverlap(
  targetDateStr: string,
  candidateTimeSlotStr: string,
  activeBookings: { date: string; timeSlot: string; status?: string }[]
): boolean {
  try {
    const candidateRange = parseTimeRange(candidateTimeSlotStr);
    const bookings = activeBookings.filter((b) => b.status !== 'cancelled');

    for (const b of bookings) {
      const bInterval = getIntervalRelativeToDay(b.date, b.timeSlot, targetDateStr);
      if (bInterval) {
        if (intervalsOverlap(candidateRange.startMinutes, candidateRange.endMinutes, bInterval.start, bInterval.end)) {
          return true;
        }
      }
    }
  } catch (e) {
    console.error('Error in overlap check:', e);
  }
  return false;
}
