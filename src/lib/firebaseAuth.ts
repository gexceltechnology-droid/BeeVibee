import { auth, isFirebaseConfigured } from './firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
  }
}

/**
 * Format phone number to E.164 (e.g., +919900106474)
 */
export function formatPhoneNumberE164(phone: string): string {
  const cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (!phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  return phone.trim();
}

/**
 * Initialize Invisible reCAPTCHA on a unique dynamic container.
 * Completely eliminates "reCAPTCHA has already been rendered in this element" error.
 */
export function setupRecaptcha(_containerOrButtonId?: string): RecaptchaVerifier | null {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) {
    return null;
  }

  // Clear previous verifier instance if any
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    window.recaptchaVerifier = null;
  }

  // Always create a brand-new unique container ID to guarantee zero element collision
  const uniqueId = `fb-recaptcha-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const containerEl = document.createElement('div');
  containerEl.id = uniqueId;
  containerEl.style.display = 'none';
  document.body.appendChild(containerEl);

  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, uniqueId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, clearing instance...');
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch {}
          window.recaptchaVerifier = null;
        }
      },
    });

    window.recaptchaVerifier = recaptchaVerifier;
    return recaptchaVerifier;
  } catch (err: unknown) {
    console.error('Error creating RecaptchaVerifier:', err);
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
    
    // Reset instance on error so next attempt gets a fresh verifier
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = null;
    }

    let userMsg = error?.message || 'Failed to send OTP via Firebase.';
    
    if (error?.code === 'auth/unauthorized-domain') {
      userMsg = 'Domain Authorization Required: Please add "beevibe.org" and "www.beevibe.org" in Firebase Console under Authentication > Settings > Authorized Domains.';
    } else if (error?.code === 'auth/invalid-phone-number') {
      userMsg = 'Invalid phone number format. Please enter a valid 10-digit mobile number.';
    } else if (error?.code === 'auth/too-many-requests') {
      userMsg = 'Too many OTP requests. Please wait a few minutes before trying again.';
    } else if (error?.code === 'auth/billing-not-enabled') {
      userMsg = 'Firebase Billing Required: Please upgrade Firebase project to the Blaze (Pay-as-you-go) plan to send SMS to real mobile numbers (10,000 free SMS/month).';
    } else if (error?.code === 'auth/operation-not-allowed') {
      userMsg = 'SMS Region Policy: Please enable India (+91) under Firebase Console > Authentication > Settings > SMS Region Policy.';
    } else if (error?.code === 'auth/quota-exceeded') {
      userMsg = 'SMS Quota Exceeded for today. Please upgrade Firebase project or try again tomorrow.';
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
    if (error?.code === 'auth/code-expired') {
      userMsg = 'The OTP code has expired. Please request a new OTP.';
    }
    return { success: false, error: userMsg };
  }
}
