import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isFirestoreConfigured, getDb } from './firestore';

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'visit_scheduled' | 'converted' | 'lost';
export type LeadSource = 'Website' | 'WhatsApp' | 'Phone Call' | 'Instagram' | 'Google Search' | 'Walk-in' | 'Other';

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  occasion?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  guestCount?: number;
  packageInterest?: string;
  budget?: number;
  source: LeadSource;
  campaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  stage: LeadStage;
  lostReason?: string;
  aiClassification?: {
    intent: 'high' | 'medium' | 'low';
    summary: string;
    suggestedAction: string;
  };
  followUpDue?: string;
  notes?: string[];
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const TMP_LEADS_FILE = path.join('/tmp', 'leads.json');

const IS_SERVERLESS = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

function getLeadsFilePath(): string {
  if (IS_SERVERLESS) {
    if (fs.existsSync(TMP_LEADS_FILE)) return TMP_LEADS_FILE;
    if (fs.existsSync(LEADS_FILE)) {
      try {
        fs.copyFileSync(LEADS_FILE, TMP_LEADS_FILE);
        return TMP_LEADS_FILE;
      } catch {
        return TMP_LEADS_FILE;
      }
    }
    return TMP_LEADS_FILE;
  }
  return LEADS_FILE;
}

export function readLeadsFromLocal(): Lead[] {
  try {
    const filePath = getLeadsFilePath();
    if (!fs.existsSync(filePath)) {
      return getInitialSampleLeads();
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[Leads DB] Read error, returning samples:', err);
    return getInitialSampleLeads();
  }
}

export function writeLeadsToLocal(leads: Lead[]): void {
  try {
    const filePath = getLeadsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Leads DB] Write error:', err);
  }
}

export async function getAllLeads(): Promise<Lead[]> {
  if (isFirestoreConfigured()) {
    try {
      const db = getDb();
      const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      }
    } catch (err) {
      console.warn('[Leads Firestore] Fallback to local leads:', err);
    }
  }
  return readLeadsFromLocal();
}

export async function createLead(leadData: Partial<Lead>): Promise<Lead> {
  const cleanPhone = (leadData.phone || '').replace(/\D/g, '').slice(-10);
  const now = new Date().toISOString();

  // Basic AI-style intent classifier based on data completeness
  const hasDate = Boolean(leadData.preferredDate);
  const hasOccasion = Boolean(leadData.occasion);
  const hasPackage = Boolean(leadData.packageInterest);
  
  let intent: 'high' | 'medium' | 'low' = 'low';
  let suggestedAction = 'Follow up via WhatsApp to understand event date and requirements.';
  
  if (hasDate && (hasOccasion || hasPackage)) {
    intent = 'high';
    suggestedAction = `Check availability for ${leadData.preferredDate} and offer package discount.`;
  } else if (hasDate || hasOccasion) {
    intent = 'medium';
    suggestedAction = 'Send WhatsApp brochure and suite video links.';
  }

  const newLead: Lead = {
    id: leadData.id || `lead_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    customerName: (leadData.customerName || 'Inquiry Guest').trim(),
    phone: cleanPhone || leadData.phone || '',
    email: leadData.email ? leadData.email.trim() : undefined,
    occasion: leadData.occasion || 'Celebration',
    preferredDate: leadData.preferredDate,
    preferredTimeSlot: leadData.preferredTimeSlot,
    guestCount: Number(leadData.guestCount) || 2,
    packageInterest: leadData.packageInterest || 'Royal Butterfly Room',
    budget: leadData.budget ? Number(leadData.budget) : undefined,
    source: (leadData.source as LeadSource) || 'Website',
    campaignId: leadData.campaignId,
    utmSource: leadData.utmSource,
    utmMedium: leadData.utmMedium,
    utmCampaign: leadData.utmCampaign,
    stage: (leadData.stage as LeadStage) || 'new',
    aiClassification: leadData.aiClassification || {
      intent,
      summary: `${leadData.occasion || 'Event'} inquiry for ${leadData.guestCount || 2} guests.`,
      suggestedAction,
    },
    followUpDue: leadData.followUpDue || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    notes: leadData.notes || ['Lead captured via system inquiry form.'],
    bookingId: leadData.bookingId,
    createdAt: now,
    updatedAt: now,
  };

  // Check for duplicates in local store
  const existingLeads = await getAllLeads();
  const duplicate = existingLeads.find(l => l.phone.slice(-10) === cleanPhone && l.stage !== 'lost' && l.stage !== 'converted');

  if (duplicate) {
    duplicate.notes = duplicate.notes || [];
    duplicate.notes.push(`[${now.slice(0, 10)}] Duplicate inquiry from ${newLead.source}: ${newLead.occasion || 'general'}`);
    duplicate.updatedAt = now;
    if (newLead.preferredDate) duplicate.preferredDate = newLead.preferredDate;
    await updateLead(duplicate.id, duplicate);
    return duplicate;
  }

  if (isFirestoreConfigured()) {
    try {
      const db = getDb();
      await db.collection('leads').doc(newLead.id).set(newLead);
    } catch (err) {
      console.warn('[Leads Firestore] Save fallback:', err);
    }
  }

  const all = [newLead, ...existingLeads];
  writeLeadsToLocal(all);
  return newLead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const now = new Date().toISOString();
  const leads = await getAllLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return null;

  const updated: Lead = {
    ...leads[index],
    ...updates,
    updatedAt: now,
  };

  leads[index] = updated;

  if (isFirestoreConfigured()) {
    try {
      const db = getDb();
      await db.collection('leads').doc(id).set(updated, { merge: true });
    } catch (err) {
      console.warn('[Leads Firestore] Update fallback:', err);
    }
  }

  writeLeadsToLocal(leads);
  return updated;
}

export async function deleteLead(id: string): Promise<boolean> {
  const leads = await getAllLeads();
  const filtered = leads.filter(l => l.id !== id);
  if (filtered.length === leads.length) return false;

  if (isFirestoreConfigured()) {
    try {
      const db = getDb();
      await db.collection('leads').doc(id).delete();
    } catch (err) {
      console.warn('[Leads Firestore] Delete fallback:', err);
    }
  }

  writeLeadsToLocal(filtered);
  return true;
}

function getInitialSampleLeads(): Lead[] {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  return [
    {
      id: 'lead_sample_1',
      customerName: 'Ananya Sharma',
      phone: '9876543210',
      email: 'ananya.s@gmail.com',
      occasion: 'Birthday Celebration',
      preferredDate: today,
      preferredTimeSlot: '05:30 PM - 07:30 PM',
      guestCount: 4,
      packageInterest: 'Royal Butterfly Room',
      budget: 2000,
      source: 'WhatsApp',
      stage: 'qualified',
      aiClassification: {
        intent: 'high',
        summary: 'High intent surprise birthday inquiry for 4 guests with cake and cold fog addon.',
        suggestedAction: 'Send slot confirmation link & block Royal Butterfly slot.',
      },
      followUpDue: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      notes: ['Prefers purple butterfly theme with LED board "Happy Birthday Ananya".'],
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'lead_sample_2',
      customerName: 'Rohan Mehra',
      phone: '9845012345',
      email: 'rohan.m@yahoo.com',
      occasion: 'Romantic Anniversary',
      preferredDate: today,
      preferredTimeSlot: '08:00 PM - 10:00 PM',
      guestCount: 2,
      packageInterest: 'Red Velvet Heart Room',
      budget: 1500,
      source: 'Website',
      stage: 'contacted',
      aiClassification: {
        intent: 'high',
        summary: 'First anniversary celebration. Inquired about private candlelit dinner and rose petals.',
        suggestedAction: 'Share photos of Red Velvet suite with couple package promo.',
      },
      followUpDue: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
      notes: ['Called regarding special couple decorations and custom music playlist.'],
      createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'lead_sample_3',
      customerName: 'Karthik Raja',
      phone: '9900112233',
      occasion: 'Gaming Tournament',
      preferredDate: today,
      preferredTimeSlot: '03:00 PM - 05:00 PM',
      guestCount: 4,
      packageInterest: 'PS5 Gaming Lounge',
      budget: 1000,
      source: 'Instagram',
      stage: 'new',
      aiClassification: {
        intent: 'medium',
        summary: 'PS5 FIFA 24 / Mortal Kombat session inquiry.',
        suggestedAction: 'Confirm 4-controller availability in PS5 Gaming Lounge.',
      },
      followUpDue: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      notes: ['Direct message via Instagram @beevibe_theatre'],
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
