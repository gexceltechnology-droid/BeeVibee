import { auth, isFirebaseConfigured } from './firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

/**
 * Format phone number to E.164 (e.g., +919900106474)
 */
export function formatPhoneNumberE164(phone: string): string {
  let cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (!phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  return phone.trim();
}

/**
 * Initialize Invisible reCAPTCHA on a target element ID or button.
 * Dynamically creates container div in DOM if missing.
 */
export function setupRecaptcha(containerOrButtonId: string): RecaptchaVerifier | null {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) {
    return null;
  }

  try {
    // Ensure element exists in DOM
    let containerEl = document.getElementById(containerOrButtonId);
    if (!containerEl) {
      containerEl = document.createElement('div');
      containerEl.id = containerOrButtonId;
      containerEl.style.display = 'none';
      document.body.appendChild(containerEl);
    }

    // Clear any existing instance window widget if present
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        // ignore reset error
      }
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, containerOrButtonId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, please try again.');
      },
    });

    (window as any).recaptchaVerifier = recaptchaVerifier;
    return recaptchaVerifier;
  } catch (err) {
    console.error('Error initializing Firebase RecaptchaVerifier:', err);
    return null;
  }
}

/**
 * Send SMS OTP via Firebase Auth
 */
export async function sendFirebaseOtp(
  phone: string,
  appVerifier: RecaptchaVerifier
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumberE164(phone);
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    return { success: true, confirmationResult };
  } catch (error: any) {
    console.error('Firebase send SMS error:', error);
    let userMsg = error.message || 'Failed to send OTP via Firebase.';
    
    if (error.code === 'auth/unauthorized-domain') {
      userMsg = 'Domain Authorization Required: Please add "beevibe.org" and "www.beevibe.org" in Firebase Console under Authentication > Settings > Authorized Domains.';
    } else if (error.code === 'auth/invalid-phone-number') {
      userMsg = 'Invalid phone number format. Please enter a valid 10-digit mobile number.';
    } else if (error.code === 'auth/too-many-requests') {
      userMsg = 'Too many OTP requests. Please wait a few minutes before trying again.';
    } else if (error.code === 'auth/quota-exceeded') {
      userMsg = 'SMS Quota Exceeded for today. Please contact support or try again tomorrow.';
    }
    return { success: false, error: userMsg };
  }
}

/**
 * Confirm OTP entered by customer
 */
export async function verifyFirebaseOtpCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await confirmationResult.confirm(code);
    return { success: true };
  } catch (error: any) {
    console.error('Firebase OTP verification error:', error);
    let userMsg = 'Invalid OTP code. Please check and try again.';
    if (error.code === 'auth/code-expired') {
      userMsg = 'The OTP code has expired. Please request a new OTP.';
    }
    return { success: false, error: userMsg };
  }
}
