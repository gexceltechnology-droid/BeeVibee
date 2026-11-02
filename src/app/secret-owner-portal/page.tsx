'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import type { MenuItem, PaymentLedgerEntry } from '@/lib/db';
import { ROOMS, ADD_ONS, RoomExperience } from '@/types/booking';
import {
  checkBookingOverlap,
  normalizeRoomId,
  isLateNightSlot,
  parseTimeRange,
  convert12HourToMinutes,
  convertMinutesTo12Hour,
  formatCustomTimeRange,
} from '@/lib/time';

const STANDARD_MANUAL_SLOTS = [
  '10:00 AM - 11:30 AM',
  '12:00 PM - 01:30 PM',
  '02:00 PM - 03:30 PM',
  '04:00 PM - 05:30 PM',
  '06:00 PM - 07:30 PM',
  '08:00 PM - 09:30 PM',
  '10:00 PM - 11:30 PM',
  '12:00 AM - 01:30 AM',
];
import { CrmEngine, AggregatedCustomerProfile } from '@/lib/saas/crmEngine';
import { CAMPAIGN_TEMPLATES, MarketingEngine } from '@/lib/saas/marketingEngine';
import SewayaOverview from '@/components/admin/SewayaOverview';
import LeadHub from '@/components/admin/LeadHub';
import OperationsHub from '@/components/admin/OperationsHub';
import AIAssistantDrawer from '@/components/admin/AIAssistantDrawer';

interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  bookingType?: 'gaming' | 'theater';
  roomId?: string;
  theme?: string;
  source?: 'Website' | 'WhatsApp' | 'Phone Call' | 'Walk-in' | string;
  addOns: string[];
  totalPrice: number;
  advancePaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  paymentMode?: string;
  utrNumber?: string;
  sbiVerified?: boolean;
  balanceCollected?: boolean;
  couponCode?: string;
  discountAmount?: number;
  adminNotes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'tentative' | 'completed';
  paymentLedger?: PaymentLedgerEntry[];
  guestCount: number;
  specialRequests?: string;
  createdAt: string;
}

interface FoodOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface FoodOrder {
  id: string;
  theme: 'pink' | 'purple' | 'red';
  themeLabel: string;
  customerName?: string;
  phone?: string;
  items: FoodOrderItem[];
  totalPrice: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'served' | 'cancelled';
  createdAt: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'bookings' | 'calendar' | 'payments' | 'operations' | 'crm' | 'orders' | 'qrs' | 'menu' | 'themes'>('overview');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Themes & Costs State
  const [themesList, setThemesList] = useState<RoomExperience[]>(ROOMS);
  const [savingThemeId, setSavingThemeId] = useState<string | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);
  const [editingThemeImages, setEditingThemeImages] = useState<Record<string, {
    image: string;
    galleryImages: string[];
    price: number;
    extraGuestPrice: number;
    description: string;
    duration: string;
  }>>({});
  
  // Filter States
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState<'all' | 'theater' | 'gaming'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'Website' | 'WhatsApp' | 'Phone Call' | 'Walk-in'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'verified' | 'pending' | 'balance_due' | 'settled'>('all');
  const [crmTierFilter, setCrmTierFilter] = useState<'all' | 'VIP' | 'REGULAR' | 'GAMER' | 'NEW'>('all');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'all' | 'snacks' | 'beverages' | 'desserts'>('all');
  
  // Food Orders
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  
  // Menu Items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // CRM State
  const [selectedCustomer, setSelectedCustomer] = useState<AggregatedCustomerProfile | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [copiedUtrId, setCopiedUtrId] = useState<string | null>(null);

  // Menu Modal States
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState<'snacks' | 'beverages' | 'desserts'>('snacks');
  const [itemDescription, setItemDescription] = useState('');
  const [itemIcon, setItemIcon] = useState('🍿');
  const [menuSubmitting, setMenuSubmitting] = useState(false);

  // Invoice / Bill Generator Modal State
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);

  // Manual Booking Modal States
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualSource, setManualSource] = useState<'WhatsApp' | 'Phone Call' | 'Walk-in' | 'Website'>('Walk-in');
  const [manualRoomId, setManualRoomId] = useState<string>('angel-wings');
  const [manualDate, setManualDate] = useState<string>(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  });
  const [manualTimeSlot, setManualTimeSlot] = useState<string>('10:00 AM - 11:30 AM');
  const [manualSlotMode, setManualSlotMode] = useState<'standard' | 'custom'>('standard');
  const [manualCustomStartHour, setManualCustomStartHour] = useState<string>('10');
  const [manualCustomStartMin, setManualCustomStartMin] = useState<string>('00');
  const [manualCustomStartAmPm, setManualCustomStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [manualCustomEndHour, setManualCustomEndHour] = useState<string>('11');
  const [manualCustomEndMin, setManualCustomEndMin] = useState<string>('30');
  const [manualCustomEndAmPm, setManualCustomEndAmPm] = useState<'AM' | 'PM'>('AM');
  const [manualGuests, setManualGuests] = useState<number>(2);
  const [manualAddOns, setManualAddOns] = useState<string[]>([]);
  const [manualTotalPrice, setManualTotalPrice] = useState<number>(1299);
  const [manualAdvancePaid, setManualAdvancePaid] = useState<number>(500);
  const [manualPaymentMode, setManualPaymentMode] = useState<string>('Cash');
  const [manualUtr, setManualUtr] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualStatus, setManualStatus] = useState<'confirmed' | 'tentative'>('confirmed');
  const [manualSubmitting, setManualSubmitting] = useState<boolean>(false);
  const [manualError, setManualError] = useState<string>('');

  // Record Payment Modal States
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectPaymentMode, setCollectPaymentMode] = useState<string>('Cash');
  const [collectType, setCollectType] = useState<'balance' | 'advance' | 'full' | 'refund'>('balance');
  const [collectUtr, setCollectUtr] = useState<string>('');
  const [collectNotes, setCollectNotes] = useState<string>('');
  const [collectSubmitting, setCollectSubmitting] = useState<boolean>(false);

  // Edit Booking Modal State
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [editRoomId, setEditRoomId] = useState('angel-wings');
  const [editPackageName, setEditPackageName] = useState('');
  const [editGuestCount, setEditGuestCount] = useState('2');
  const [editTotalPrice, setEditTotalPrice] = useState('1299');
  const [editAdvancePaid, setEditAdvancePaid] = useState('500');
  const [editBalanceDue, setEditBalanceDue] = useState('799');
  const [editStatus, setEditStatus] = useState<Booking['status']>('confirmed');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pending' | 'advance_paid' | 'fully_paid' | string>('advance_paid');
  const [editPaymentMode, setEditPaymentMode] = useState('UPI (8123635342@sbi)');
  const [editUtrNumber, setEditUtrNumber] = useState('');
  const [editSource, setEditSource] = useState('Website');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [editBookingSubmitting, setEditBookingSubmitting] = useState(false);
  const [editBookingError, setEditBookingError] = useState('');

  // Calendar View State
  const [calendarViewDate, setCalendarViewDate] = useState<string>(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  });

  // Web Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);
  const knownBookingIdsRef = useRef<Set<string> | null>(null);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      interface WindowWithWebkitAudio extends Window {
        webkitAudioContext?: typeof AudioContext;
      }
      const AudioCtxClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (AudioCtxClass) {
        audioContextRef.current = new AudioCtxClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleGesture = () => initAudioContext();
    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [initAudioContext]);

  const playOrderSound = useCallback(async () => {
    try {
      initAudioContext();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };

      const now = ctx.currentTime;
      playNote(523.25, now, 0.18);
      playNote(659.25, now + 0.12, 0.18);
      playNote(783.99, now + 0.24, 0.35);
    } catch (e) {
      console.warn('Could not play order chime:', e);
    }
  }, [initAudioContext]);

  const playBookingSound = useCallback(async () => {
    try {
      initAudioContext();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };

      const now = ctx.currentTime;
      playNote(587.33, now, 0.12);
      playNote(698.46, now + 0.1, 0.12);
      playNote(880.00, now + 0.2, 0.25);
    } catch (e) {
      console.warn('Could not play booking chime:', e);
    }
  }, [initAudioContext]);

  // Fetch Bookings
  const fetchBookings = useCallback(async (codeValue?: string, isBackground = false) => {
    const activePasscode = (codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    if (!activePasscode) return;

    try {
      const res = await fetch('/api/bookings', {
        headers: { 'X-Admin-Passcode': activePasscode },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!res.ok) throw new Error('Failed to load bookings.');
      const data = await res.json();
      const currentBookings: Booking[] = data.bookings || [];

      if (knownBookingIdsRef.current !== null) {
        const newItems = currentBookings.filter(b => !knownBookingIdsRef.current!.has(b.id));
        if (newItems.length > 0) {
          setNewlyAddedIds(newItems.map(b => b.id));
          await playBookingSound();
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('🎬 New Bee Vibe Booking!', {
                body: `${newItems[0].customerName} booked ${newItems[0].packageName} for ${newItems[0].date}`,
                icon: '/logo.png',
              });
            } catch {
              // Ignore notification error
            }
          }
        }
      }
      knownBookingIdsRef.current = new Set(currentBookings.map(b => b.id));
      setBookings(currentBookings);
    } catch (err: unknown) {
      if (!isBackground) {
        setError(err instanceof Error ? err.message : 'Error fetching bookings.');
      }
    }
  }, [playBookingSound]);

  // Fetch Orders
  const fetchOrders = useCallback(async (codeValue?: string) => {
    const activePasscode = (codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    if (!activePasscode) return;

    try {
      const res = await fetch('/api/orders', {
        headers: { 'X-Admin-Passcode': activePasscode },
      });
      if (res.ok) {
        const data = await res.json();
        const currentOrders: FoodOrder[] = data.orders || [];
        if (knownOrderIdsRef.current !== null) {
          const newOrders = currentOrders.filter(o => !knownOrderIdsRef.current!.has(o.id));
          if (newOrders.length > 0) {
            await playOrderSound();
          }
        }
        knownOrderIdsRef.current = new Set(currentOrders.map(o => o.id));
        setOrders(currentOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, [playOrderSound]);

  // Fetch Menu
  const fetchMenu = useCallback(async (codeValue?: string) => {
    const activePasscode = (codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    if (!activePasscode) return;

    try {
      const res = await fetch('/api/menu', {
        headers: { 'X-Admin-Passcode': activePasscode },
      });
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data.menuItems || []);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
  }, []);

  // Fetch Themes & Pricing
  const fetchThemes = useCallback(async () => {
    try {
      const res = await fetch('/api/themes');
      if (res.ok) {
        const data = await res.json();
        if (data.themes && Array.isArray(data.themes)) {
          setThemesList(data.themes);
        }
      }
    } catch (err) {
      console.error('Error fetching themes:', err);
    }
  }, []);

  // Sync editingThemeImages whenever themesList updates
  useEffect(() => {
    const initialMap: Record<string, any> = {};
    for (const t of themesList) {
      initialMap[t.id] = {
        image: t.image,
        galleryImages: t.galleryImages ? [...t.galleryImages] : [t.image],
        price: t.price,
        extraGuestPrice: t.extraGuestPrice ?? 100,
        description: t.description || '',
        duration: t.duration || '1 Hr 30 Mins',
      };
    }
    setEditingThemeImages(prev => ({ ...initialMap, ...prev }));
  }, [themesList]);

  // Handle Save Theme
  const handleSaveTheme = async (themeId: string) => {
    const currentEdit = editingThemeImages[themeId];
    if (!currentEdit) return;

    setSavingThemeId(themeId);
    setThemeFeedback(null);

    try {
      const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
      const res = await fetch('/api/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          id: themeId,
          price: Number(currentEdit.price),
          extraGuestPrice: Number(currentEdit.extraGuestPrice),
          image: currentEdit.image,
          galleryImages: currentEdit.galleryImages,
          description: currentEdit.description,
          duration: currentEdit.duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save theme modifications');
      }

      setThemesList(prev => prev.map(t => (t.id === themeId ? { ...t, ...data.theme } : t)));
      setThemeFeedback({ id: themeId, msg: `Saved! Base ₹${currentEdit.price} and imagery updated successfully.`, type: 'success' });
      setTimeout(() => setThemeFeedback(null), 5000);
    } catch (err: any) {
      setThemeFeedback({ id: themeId, msg: err.message || 'Error saving theme.', type: 'error' });
    } finally {
      setSavingThemeId(null);
    }
  };

  const verifyPasscode = useCallback(async (codeToCheck: string) => {
    const cleanCode = codeToCheck.trim();
    if (!cleanCode) {
      setLoginError('Please enter the passcode.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanCode }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        sessionStorage.setItem('bee_vibe_admin_passcode', cleanCode);
        setIsAuthenticated(true);
        fetchBookings(cleanCode);
        fetchOrders(cleanCode);
        fetchMenu(cleanCode);
        fetchThemes();

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      } else {
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        setIsAuthenticated(false);
        setLoginError(data.error || 'Incorrect admin passcode.');
      }
    } catch {
      setLoginError('Error connecting to authentication server.');
      setIsAuthenticated(false);
    } finally {
      setLoginLoading(false);
    }
  }, [fetchBookings, fetchOrders, fetchMenu, fetchThemes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedCode = typeof window !== 'undefined' ? sessionStorage.getItem('bee_vibe_admin_passcode') : null;
      if (savedCode) {
        verifyPasscode(savedCode);
      } else {
        setIsAuthenticated(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [verifyPasscode]);

  // Initial load of themes regardless of auth
  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Polling for live bookings, payments, orders, and themes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchBookings(undefined, true);
      fetchOrders(undefined);
      fetchMenu(undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchBookings, fetchOrders, fetchMenu]);

  // Derived CRM profiles memoized without cascading effects
  const crmProfiles = useMemo(() => {
    if (bookings.length > 0 || orders.length > 0) {
      return CrmEngine.aggregateCustomerProfiles('tenant_beevibe', bookings, orders);
    }
    return [];
  }, [bookings, orders]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) {
      setLoginError('Please enter the passcode.');
      return;
    }
    verifyPasscode(passcodeInput.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bee_vibe_admin_passcode');
    setIsAuthenticated(false);
    setBookings([]);
    setOrders([]);
    setMenuItems([]);
    setPasscodeInput('');
  };

  // Booking Status Update Handler
  const handleUpdateBookingStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      } else {
        alert('Failed to update booking status.');
      }
    } catch (err: unknown) {
      alert('Error updating booking: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Delete Booking Handler
  const handleDeleteBooking = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete booking #${id}?`)) return;
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== id));
      } else {
        alert('Failed to delete booking.');
      }
    } catch (err: unknown) {
      alert('Error deleting booking: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Edit Booking Handlers
  const handleOpenEditBookingModal = (booking: Booking) => {
    setEditingBooking(booking);
    setEditCustomerName(booking.customerName || '');
    setEditPhone(booking.phone || '');
    setEditEmail(booking.email || '');
    setEditDate(booking.date || '');
    setEditTimeSlot(booking.timeSlot || '');
    setEditRoomId(booking.roomId || 'angel-wings');
    setEditPackageName(booking.packageName || '');
    setEditGuestCount(String(booking.guestCount || 2));
    setEditTotalPrice(String(booking.totalPrice || 0));
    setEditAdvancePaid(String(booking.advancePaid ?? 500));
    setEditBalanceDue(String(booking.balanceDue ?? Math.max(0, (booking.totalPrice || 0) - (booking.advancePaid ?? 500))));
    setEditStatus(booking.status || 'confirmed');
    setEditPaymentStatus(booking.paymentStatus || 'advance_paid');
    setEditPaymentMode(booking.paymentMode || 'UPI (8123635342@sbi)');
    setEditUtrNumber(booking.utrNumber || '');
    setEditSource(booking.source || 'Website');
    setEditSpecialRequests(booking.specialRequests || '');
    setEditAdminNotes(booking.adminNotes || '');
    setEditBookingError('');
    setIsEditBookingModalOpen(true);
  };

  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setEditBookingSubmitting(true);
    setEditBookingError('');

    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          id: editingBooking.id,
          action: 'edit_booking',
          customerName: editCustomerName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || undefined,
          date: editDate,
          timeSlot: editTimeSlot,
          roomId: editRoomId,
          packageName: editPackageName.trim() || editRoomId,
          guestCount: Number(editGuestCount) || 2,
          totalPrice: Number(editTotalPrice) || 0,
          advancePaid: Number(editAdvancePaid) || 0,
          balanceDue: Number(editBalanceDue) || 0,
          status: editStatus,
          paymentStatus: editPaymentStatus,
          paymentMode: editPaymentMode,
          utrNumber: editUtrNumber.trim() || undefined,
          source: editSource,
          specialRequests: editSpecialRequests.trim() || undefined,
          adminNotes: editAdminNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save booking edits.');
      }

      setBookings(prev => prev.map(b => b.id === editingBooking.id ? (data.booking || { ...b, ...data }) : b));
      setIsEditBookingModalOpen(false);
      setEditingBooking(null);
      alert(`✅ Booking ${editingBooking.id} updated successfully!`);
    } catch (err: unknown) {
      setEditBookingError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditBookingSubmitting(false);
    }
  };

  // Delete Food Order Handler
  const handleDeleteOrder = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete food order #${id}?`)) return;
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        alert('Failed to delete food order.');
      }
    } catch (err: unknown) {
      alert('Error deleting order: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Food Order Status Update Handler
  const handleUpdateOrderStatus = async (id: string, newStatus: 'pending' | 'preparing' | 'served' | 'cancelled') => {
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      } else {
        alert('Failed to update order status.');
      }
    } catch (err: unknown) {
      alert('Error updating order: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Payment Reconciliation Toggle: SBI Bank Verification
  const handleToggleSbiVerification = async (booking: Booking) => {
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    const newSbiStatus = !booking.sbiVerified;

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          id: booking.id,
          sbiVerified: newSbiStatus,
          status: newSbiStatus ? 'confirmed' : booking.status,
        }),
      });

      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, sbiVerified: newSbiStatus, status: newSbiStatus ? 'confirmed' : b.status } : b));
      } else {
        alert('Failed to update SBI verification status.');
      }
    } catch (err: unknown) {
      alert('Error updating payment reconciliation: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Payment Reconciliation Toggle: Venue Balance Settlement
  const handleToggleBalanceSettlement = async (booking: Booking) => {
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    const newBalanceCollected = !booking.balanceCollected;

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          id: booking.id,
          balanceCollected: newBalanceCollected,
        }),
      });

      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, balanceCollected: newBalanceCollected, paymentStatus: newBalanceCollected ? 'fully_paid' : 'advance_paid' } : b));
      } else {
        alert('Failed to update balance collection status.');
      }
    } catch (err: unknown) {
      alert('Error updating balance collection: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const calculatePriceForManualBooking = (roomId: string, guests: number, addOns: string[], slot: string): number => {
    const isGaming = roomId === 'ps5-gaming';
    const foundTheme = themesList.find(t => t.id === roomId);
    let base = foundTheme ? foundTheme.price : 1299;
    if (roomId === 'ps5-gaming') base = 399;

    let durationHours = 1.5;
    try {
      const { startMinutes, endMinutes } = parseTimeRange(slot);
      const diff = endMinutes - startMinutes;
      if (diff > 0) {
        durationHours = diff / 60;
      }
    } catch {}

    // Scale base price proportionally for custom durations (e.g. 2 hours, 3 hours)
    if (durationHours > 0 && !isGaming && durationHours !== 1.5) {
      base = Math.round((base / 1.5) * durationHours);
    }

    const extraRate = foundTheme ? (foundTheme.extraGuestPrice ?? 100) : 100;
    const extraGuests = Math.max(0, guests - 2) * extraRate;

    let addonsSum = 0;
    for (const addonId of addOns) {
      const found = ADD_ONS.find(a => a.id === addonId || a.name === addonId);
      if (found) {
        addonsSum += found.price;
      }
    }

    const lateNightFee = (!isGaming && isLateNightSlot(slot)) ? 500 : 0;
    return base + extraGuests + addonsSum + lateNightFee;
  };

  const updateManualCustomSlot = (
    sH = manualCustomStartHour,
    sM = manualCustomStartMin,
    sAp = manualCustomStartAmPm,
    eH = manualCustomEndHour,
    eM = manualCustomEndMin,
    eAp = manualCustomEndAmPm
  ) => {
    const startM = convert12HourToMinutes(parseInt(sH, 10), parseInt(sM, 10), sAp);
    let endM = convert12HourToMinutes(parseInt(eH, 10), parseInt(eM, 10), eAp);
    if (endM <= startM) {
      endM += 24 * 60;
    }
    const slotStr = formatCustomTimeRange(startM, endM);
    setManualTimeSlot(slotStr);
    const newPrice = calculatePriceForManualBooking(manualRoomId, manualGuests, manualAddOns, slotStr);
    setManualTotalPrice(newPrice);
  };

  const applyManualQuickDuration = (durationH: number) => {
    const startM = convert12HourToMinutes(
      parseInt(manualCustomStartHour, 10),
      parseInt(manualCustomStartMin, 10),
      manualCustomStartAmPm
    );
    const endM = startM + Math.round(durationH * 60);
    const { hour12, minute, ampm } = convertMinutesTo12Hour(endM);
    const eHStr = hour12.toString().padStart(2, '0');
    const eMStr = minute.toString().padStart(2, '0');
    setManualCustomEndHour(eHStr);
    setManualCustomEndMin(eMStr);
    setManualCustomEndAmPm(ampm);

    const slotStr = formatCustomTimeRange(startM, endM);
    setManualTimeSlot(slotStr);
    const newPrice = calculatePriceForManualBooking(manualRoomId, manualGuests, manualAddOns, slotStr);
    setManualTotalPrice(newPrice);
  };

  const handleOpenManualBooking = (presetRoom?: string, presetSlot?: string, presetDate?: string) => {
    const targetRoom = presetRoom || 'angel-wings';
    const targetDate = presetDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const isGaming = targetRoom === 'ps5-gaming';
    const defaultStandardSlot = isGaming ? '10:00 AM - 11:00 AM' : '10:00 AM - 11:30 AM';
    const targetSlot = presetSlot || defaultStandardSlot;

    const isStandard = STANDARD_MANUAL_SLOTS.includes(targetSlot);
    setManualSlotMode(isStandard ? 'standard' : (presetSlot ? 'custom' : 'standard'));

    try {
      const { startMinutes, endMinutes } = parseTimeRange(targetSlot);
      const s = convertMinutesTo12Hour(startMinutes);
      const e = convertMinutesTo12Hour(endMinutes);
      setManualCustomStartHour(s.hour12.toString().padStart(2, '0'));
      setManualCustomStartMin(s.minute.toString().padStart(2, '0'));
      setManualCustomStartAmPm(s.ampm);
      setManualCustomEndHour(e.hour12.toString().padStart(2, '0'));
      setManualCustomEndMin(e.minute.toString().padStart(2, '0'));
      setManualCustomEndAmPm(e.ampm);
    } catch {
      setManualCustomStartHour('10');
      setManualCustomStartMin('00');
      setManualCustomStartAmPm('AM');
      setManualCustomEndHour('11');
      setManualCustomEndMin('30');
      setManualCustomEndAmPm('AM');
    }

    const autoPrice = calculatePriceForManualBooking(targetRoom, 2, [], targetSlot);

    setManualCustomerName('');
    setManualPhone('');
    setManualEmail('');
    setManualSource('Walk-in');
    setManualRoomId(targetRoom);
    setManualDate(targetDate);
    setManualTimeSlot(targetSlot);
    setManualGuests(2);
    setManualAddOns([]);
    setManualTotalPrice(autoPrice);
    setManualAdvancePaid(Math.min(500, autoPrice));
    setManualPaymentMode('Cash');
    setManualUtr('');
    setManualNotes('');
    setManualStatus('confirmed');
    setManualError('');
    setIsManualBookingModalOpen(true);
  };

  const handleSubmitManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    const cleanName = manualCustomerName.trim();
    const cleanPhone = manualPhone.trim().replace(/\D/g, '');
    if (!cleanName) {
      setManualError('Please enter the customer name.');
      return;
    }
    if (cleanPhone.length < 10) {
      setManualError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!manualDate || !manualTimeSlot) {
      setManualError('Date and time slot are required.');
      return;
    }

    try {
      parseTimeRange(manualTimeSlot);
    } catch {
      setManualError('Please provide a valid time slot format, e.g. "10:00 AM - 11:30 AM" or "02:15 PM - 03:45 PM".');
      return;
    }

    // Client-side Overlap Check (Server also strictly re-checks)
    const targetRoomNormalized = normalizeRoomId(manualRoomId);
    const existingSameRoom = bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      return normalizeRoomId(b) === targetRoomNormalized;
    });

    const isOverlapping = checkBookingOverlap(manualDate, manualTimeSlot, existingSameRoom);
    if (isOverlapping) {
      setManualError(`Overlapping slot detected! Another booking is already active in this room for ${manualTimeSlot} on ${manualDate}.`);
      return;
    }

    setManualSubmitting(true);
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();

    try {
      const roomObj = ROOMS.find(r => r.id === manualRoomId);
      const pkgName = roomObj ? `${roomObj.name} (${roomObj.occasionLabel})` : manualRoomId;

      const payload = {
        customerName: cleanName,
        phone: cleanPhone,
        email: manualEmail.trim() || undefined,
        date: manualDate,
        timeSlot: manualTimeSlot,
        packageName: pkgName,
        roomId: manualRoomId,
        bookingType: manualRoomId === 'ps5-gaming' ? 'gaming' : 'theater',
        guestCount: manualGuests,
        addOns: manualAddOns,
        totalPrice: Number(manualTotalPrice),
        advancePaid: Number(manualAdvancePaid),
        balanceDue: Math.max(0, Number(manualTotalPrice) - Number(manualAdvancePaid)),
        paymentMode: manualPaymentMode,
        utrNumber: manualUtr.trim() || undefined,
        source: manualSource,
        adminNotes: manualNotes.trim() || undefined,
        status: manualStatus,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manual booking.');
      }

      await playBookingSound();
      await fetchBookings(activePasscode);
      setIsManualBookingModalOpen(false);
      alert(`✅ Booking ${data.booking.id} created successfully!\n\nSource: ${manualSource}\nRoom: ${roomObj?.name}\nDate & Time: ${manualDate} (${manualTimeSlot})\nAdvance: ₹${manualAdvancePaid}\n\nThis slot is now immediately blocked on the live website.`);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    const due = booking.balanceDue ?? Math.max(0, booking.totalPrice - (booking.advancePaid ?? 0));
    setCollectAmount(String(due));
    setCollectPaymentMode('Cash');
    setCollectType('balance');
    setCollectUtr('');
    setCollectNotes('');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    const numAmount = Number(collectAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount greater than ₹0.');
      return;
    }

    setCollectSubmitting(true);
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();

    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          id: selectedBookingForPayment.id,
          action: 'record_payment',
          amount: numAmount,
          paymentMode: collectPaymentMode,
          type: collectType,
          utrNumber: collectUtr.trim() || undefined,
          notes: collectNotes.trim() || undefined,
          recordedBy: 'Admin Desk Staff',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment.');
      }

      await fetchBookings(activePasscode);
      setSelectedBookingForPayment(null);
      alert(`✅ Payment of ₹${numAmount} logged into ledger for ${selectedBookingForPayment.id}.\nRemaining balance: ₹${data.booking.balanceDue}`);
    } catch (err: unknown) {
      alert('Error recording payment: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCollectSubmitting(false);
    }
  };

  // 1-Click Copy UTR Number
  const handleCopyUtr = (utr: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(utr);
      setCopiedUtrId(id);
      setTimeout(() => setCopiedUtrId(null), 2000);
    }
  };

  // Export Payment Ledger to CSV
  const handleExportPaymentLedger = () => {
    if (bookings.length === 0) {
      alert('No booking transactions to export.');
      return;
    }

    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Email', 'Show Date', 'Time Slot', 'Package', 'Total Amount', 'Advance Paid', 'Balance Due', 'UTR Number', 'SBI Bank Verified', 'Balance Collected', 'Payment Mode', 'Status', 'Created At'];
    
    const rows = bookings.map(b => [
      b.id,
      `"${b.customerName.replace(/"/g, '""')}"`,
      b.phone,
      b.email,
      b.date,
      `"${b.timeSlot}"`,
      `"${b.packageName}"`,
      b.totalPrice,
      b.advancePaid ?? 500,
      b.balanceDue ?? Math.max(0, b.totalPrice - (b.advancePaid ?? 500)),
      b.utrNumber || 'N/A',
      b.sbiVerified ? 'YES' : 'NO',
      b.balanceCollected ? 'YES' : 'NO',
      `"UPI (NALINAKSHI C - 8123635342@sbi)"`,
      b.status,
      b.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BeeVibe_Payment_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Customer CRM to CSV
  const handleExportCustomerCrm = () => {
    if (crmProfiles.length === 0) {
      alert('No customer profiles to export.');
      return;
    }

    const headers = ['Customer ID', 'Customer Name', 'Phone', 'Email', 'Tier', 'Total Bookings', 'Completed Bookings', 'Lifetime Spend (INR)', 'First Visit', 'Last Visit', 'RFM Score'];
    const rows = crmProfiles.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      c.email || '',
      c.metrics.calculatedSegment,
      c.metrics.totalBookings,
      c.metrics.completedBookings,
      c.metrics.lifetimeSpend,
      c.metrics.firstVisitAt || '',
      c.metrics.lastVisitAt || '',
      c.metrics.rfmScore,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BeeVibe_Customer_CRM_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Day-End Financial Settlement Statement
  const handlePrintDayEndSettlement = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print the financial settlement.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter(b => b.date === todayStr || b.createdAt.slice(0, 10) === todayStr);
    const totalAdv = todayBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.advancePaid ?? 500), 0);
    const totalBal = todayBookings.filter(b => b.balanceCollected).reduce((sum, b) => sum + (b.balanceDue ?? (b.totalPrice - 500)), 0);
    const totalGross = totalAdv + totalBal;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bee Vibe - Day-End Financial Settlement (${todayStr})</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 1.6rem; }
            .meta { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
            .kpi-row { display: flex; gap: 20px; margin-bottom: 24px; }
            .kpi-box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; flex: 1; text-align: center; }
            .kpi-val { font-size: 1.5rem; font-weight: bold; color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.85rem; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>🐝 Bee Vibe - Day-End Financial Settlement</h1>
          <div class="meta">Date: ${todayStr} | Generated At: ${new Date().toLocaleTimeString()} | Payee: NALINAKSHI C (8123635342@sbi)</div>
          
          <div class="kpi-row">
            <div class="kpi-box">
              <div>Total Gross Collections</div>
              <div class="kpi-val">₹${totalGross}</div>
            </div>
            <div class="kpi-box">
              <div>Advance Received (SBI UPI)</div>
              <div class="kpi-val">₹${totalAdv}</div>
            </div>
            <div class="kpi-box">
              <div>Desk Balance Collected</div>
              <div class="kpi-val">₹${totalBal}</div>
            </div>
          </div>

          <h3>Daily Transaction Register</h3>
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Show Slot</th>
                <th>Total</th>
                <th>Adv Paid (UPI)</th>
                <th>Balance Paid</th>
                <th>UTR Reference</th>
              </tr>
            </thead>
            <tbody>
              ${todayBookings.map(b => `
                <tr>
                  <td>${b.id}</td>
                  <td>${b.customerName}</td>
                  <td>${b.phone}</td>
                  <td>${b.timeSlot}</td>
                  <td>₹${b.totalPrice}</td>
                  <td>₹${b.advancePaid ?? 500} ${b.sbiVerified ? '✅' : '⏳'}</td>
                  <td>${b.balanceCollected ? '₹' + (b.balanceDue ?? (b.totalPrice - 500)) + ' ✅' : 'Pending 💵'}</td>
                  <td>${b.utrNumber || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add CRM Note for Customer
  const handleAddCrmNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNoteText.trim()) return;

    setNoteSubmitting(true);
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();

    try {
      const res = await fetch('/api/admin/crm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          phone: selectedCustomer.phone,
          note: newNoteText.trim(),
          author: 'Owner',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const note = data.note;
        setSelectedCustomer(prev => prev ? { ...prev, notes: [note, ...prev.notes] } : null);
        setNewNoteText('');
      } else {
        alert('Failed to save customer note.');
      }
    } catch (err: unknown) {
      alert('Error saving note: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Trigger WhatsApp Campaign for Customer
  const handleTriggerWhatsAppCampaign = (customer: AggregatedCustomerProfile, templateId: string) => {
    const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const message = MarketingEngine.renderMessage(template.templateText, {
      customerName: customer.name,
      businessName: 'Bee Vibe Bangalore',
      bookingLink: 'https://www.beevibe.org/book',
      googleReviewLink: 'https://g.page/r/beevibe/review',
      offerCode: 'VIBE200',
    });

    const url = MarketingEngine.generateWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
  };

  // Direct WhatsApp Chat
  const handleDirectWhatsAppChat = (phone: string, name: string) => {
    const message = `Hi ${name}! This is from Bee Vibe Bangalore. How can we assist with your celebration?`;
    const url = MarketingEngine.generateWhatsAppUrl(phone, message);
    window.open(url, '_blank');
  };

  // Menu Handlers
  const handleOpenAddMenuModal = () => {
    setEditingMenuItem(null);
    setItemName('');
    setItemPrice('');
    setItemCategory('snacks');
    setItemDescription('');
    setItemIcon('🍿');
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenuModal = (item: MenuItem) => {
    setEditingMenuItem(item);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemCategory(item.category);
    setItemDescription(item.description);
    setItemIcon(item.icon);
    setIsMenuModalOpen(true);
  };

  const handleToggleStock = async (item: MenuItem) => {
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          ...item,
          inStock: !item.inStock,
        }),
      });
      if (res.ok) {
        setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, inStock: !m.inStock } : m));
      } else {
        alert('Failed to update stock status.');
      }
    } catch (err: unknown) {
      alert('Error updating stock status: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch(`/api/menu?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });
      if (res.ok) {
        setMenuItems(prev => prev.filter(m => m.id !== id));
      } else {
        alert('Failed to delete menu item.');
      }
    } catch (err: unknown) {
      alert('Error deleting menu item: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSubmitMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice || isNaN(Number(itemPrice))) {
      alert('Please enter a valid item name and numeric price.');
      return;
    }
    setMenuSubmitting(true);
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      if (editingMenuItem) {
        const res = await fetch('/api/menu', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Passcode': activePasscode,
          },
          body: JSON.stringify({
            id: editingMenuItem.id,
            name: itemName.trim(),
            price: Number(itemPrice),
            category: itemCategory,
            description: itemDescription.trim(),
            icon: itemIcon.trim() || '🍿',
            inStock: editingMenuItem.inStock,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setMenuItems(prev => prev.map(m => m.id === editingMenuItem.id ? data.menuItem : m));
          setIsMenuModalOpen(false);
        } else {
          alert('Failed to update menu item.');
        }
      } else {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Passcode': activePasscode,
          },
          body: JSON.stringify({
            name: itemName.trim(),
            price: Number(itemPrice),
            category: itemCategory,
            description: itemDescription.trim(),
            icon: itemIcon.trim() || '🍿',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setMenuItems(prev => [...prev, data.menuItem]);
          setIsMenuModalOpen(false);
        } else {
          alert('Failed to create menu item.');
        }
      }
    } catch (err: unknown) {
      alert('Error saving menu item: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setMenuSubmitting(false);
    }
  };

  // Financial Metric Calculations
  const activeBookings = bookings.filter(b => b.status !== 'cancelled').length;

  const grossProjectedRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const totalAdvanceCollected = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.advancePaid ?? 500), 0);

  const totalBalanceDue = bookings
    .filter(b => b.status === 'confirmed' && !b.balanceCollected)
    .reduce((sum, b) => sum + (b.balanceDue ?? Math.max(0, b.totalPrice - (b.advancePaid ?? 500))), 0);

  const sbiVerifiedCount = bookings.filter(b => b.sbiVerified).length;
  const sbiPendingCount = bookings.filter(b => !b.sbiVerified && b.status !== 'cancelled').length;

  const theaterRevenue = bookings
    .filter(b => b.status === 'confirmed' && b.bookingType !== 'gaming' && !b.packageName.includes('Gaming') && !b.packageName.includes('Dark'))
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const gamingRevenue = bookings
    .filter(b => b.status === 'confirmed' && (b.bookingType === 'gaming' || b.packageName.includes('Gaming') || b.packageName.includes('Dark')))
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const servedOrdersCount = orders.filter(o => o.status === 'served').length;
  const foodRevenue = orders.filter(o => o.status === 'served').reduce((sum, o) => sum + o.totalPrice, 0);

  // CRM Metrics
  const uniqueCustomersCount = crmProfiles.length;
  const repeatGuestsCount = crmProfiles.filter(c => c.metrics.completedBookings >= 2).length;
  const repeatRate = uniqueCustomersCount > 0 ? ((repeatGuestsCount / uniqueCustomersCount) * 100).toFixed(1) : '0.0';
  const vipGuestsCount = crmProfiles.filter(c => c.metrics.calculatedSegment === 'VIP').length;

  // Filter Bookings for Bookings Tab
  const filteredBookings = bookings.filter(b => {
    const isGaming = b.bookingType === 'gaming' || b.packageName.includes('Gaming') || b.packageName.includes('Dark');
    const matchesCategory = bookingCategoryFilter === 'all' ? true : bookingCategoryFilter === 'gaming' ? isGaming : !isGaming;
    const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm) || b.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? b.date === dateFilter : true;
    const matchesSource = sourceFilter === 'all' ? true : (b.source || 'Website') === sourceFilter;
    return matchesCategory && matchesSearch && matchesDate && matchesSource;
  });

  // Filter Bookings for Payment Portal Ledger
  const filteredPaymentBookings = bookings.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm) || (b.utrNumber && b.utrNumber.includes(searchTerm));
    const matchesDate = dateFilter ? b.date === dateFilter : true;

    let matchesPaymentStatus = true;
    if (paymentFilter === 'verified') matchesPaymentStatus = !!b.sbiVerified;
    else if (paymentFilter === 'pending') matchesPaymentStatus = !b.sbiVerified && b.status !== 'cancelled';
    else if (paymentFilter === 'balance_due') matchesPaymentStatus = !b.balanceCollected && b.status === 'confirmed';
    else if (paymentFilter === 'settled') matchesPaymentStatus = !!b.balanceCollected && !!b.sbiVerified;

    return matchesSearch && matchesDate && matchesPaymentStatus;
  });

  // Filter CRM Customers
  const filteredCrmProfiles = crmProfiles.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTier = crmTierFilter === 'all' ? true : c.metrics.calculatedSegment === crmTierFilter;
    return matchesSearch && matchesTier;
  });

  // Food Orders Filter
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || o.id.toLowerCase().includes(searchTerm.toLowerCase()) || (o.phone && o.phone.includes(searchTerm));
    const matchesStatus = orderStatusFilter === 'all' ? true : o.status === orderStatusFilter;
    const orderDate = o.createdAt ? o.createdAt.slice(0, 10) : '';
    const matchesDate = orderDateFilter ? orderDate === orderDateFilter : true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Menu Items Filter
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = menuCategoryFilter === 'all' ? true : item.category === menuCategoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Standee Print Helper
  const handlePrintStandee = (themeColor: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print the standee.');
      return;
    }
    const themeTitle = themeColor === 'pink' ? 'Rose Pink Theme' : themeColor === 'purple' ? 'Neon Purple Theme' : 'Crimson Red Theme';
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(hostOrigin + '/menu?theme=' + themeColor)}`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Standee - ${themeTitle}</title>
          <style>
            body { background: #ffffff; color: #000; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
            .standee-card { border: 4px solid ${themeColor === 'pink' ? '#ff2e7e' : themeColor === 'purple' ? '#9333ea' : '#ef4848'}; border-radius: 24px; padding: 40px; width: 380px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
            .logo { font-size: 2.2rem; margin-bottom: 5px; }
            .brand { font-size: 1.8rem; font-weight: 800; margin-bottom: 20px; }
            .room-title { background: ${themeColor === 'pink' ? 'rgba(255, 46, 126, 0.1)' : themeColor === 'purple' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${themeColor === 'pink' ? '#ff2e7e' : themeColor === 'purple' ? '#9333ea' : '#ef4848'}; font-size: 1.1rem; font-weight: 700; padding: 8px 16px; border-radius: 30px; display: inline-block; margin-bottom: 24px; }
            .qr-code { width: 200px; height: 200px; margin: 0 auto 24px; }
            .instruction { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
            .sub-instruction { color: #666; font-size: 0.85rem; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="standee-card">
            <div class="logo">🍿🐝</div>
            <div class="brand">BeeVibe Cinema</div>
            <div class="room-title">${themeTitle} Room</div>
            <img class="qr-code" src="${qrUrl}" alt="QR Code" />
            <div class="instruction">Scan to Order Food</div>
            <div class="sub-instruction">Fresh snacks and drinks will be served directly to your screen area. Enjoy!</div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Status Check Screen
  if (isAuthenticated === null) {
    return (
      <div className={styles.loginWrapper}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className={styles.loadingSpinner} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verifying secure session...</p>
        </div>
      </div>
    );
  }

  // Lock Screen
  if (isAuthenticated === false) {
    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginCard}>
          <span className={styles.loginLogo}>🐝</span>
          <h2 className={styles.loginTitle}>Bee Vibe Admin</h2>
          <p className={styles.loginDesc}>Provide the secure authentication code to access the management portal.</p>
          
          <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
            <input
              type="password"
              placeholder="••••••••"
              className={styles.loginInput}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              disabled={loginLoading}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={loginLoading}>
              {loginLoading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>

          {loginError && <div className={styles.loginError}>{loginError}</div>}
          
          <Link href="/" style={{ display: 'inline-block', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated State
  return (
    <div className={styles.adminContainer}>
      {/* Mobile App Bar */}
      <div className={styles.mobileHeaderBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🐝</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#ffffff' }}>Bee Vibe Admin Hub</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={styles.mobileLiveDot} /> Live Cloud Sync Active
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#f87171' }}>
          Sign Out
        </button>
      </div>

      {/* SEWAYA-STYLE FLOATING PILL NAVIGATION BAR */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '9999px',
          border: '1px solid #f1f5f9',
          padding: '8px 20px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            🐝
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>BeeVibe</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '9999px' }}>
                Business OS
              </span>
            </div>
          </div>
        </div>

        {/* Floating Centered Segmented Navigation Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            borderRadius: '9999px',
            padding: '4px',
            gap: '2px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              border: 'none',
              background: activeTab === 'overview' ? '#1e1e24' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'overview' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 18px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'overview' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            style={{
              border: 'none',
              background: activeTab === 'leads' ? '#1e1e24' : 'transparent',
              color: activeTab === 'leads' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'leads' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'leads' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            🎯 Leads
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              border: 'none',
              background: activeTab === 'calendar' ? '#1e1e24' : 'transparent',
              color: activeTab === 'calendar' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'calendar' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'calendar' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Calendar
          </button>

          <button
            onClick={() => { setActiveTab('bookings'); setSearchTerm(''); setDateFilter(''); setSourceFilter('all'); }}
            style={{
              border: 'none',
              background: activeTab === 'bookings' ? '#1e1e24' : 'transparent',
              color: activeTab === 'bookings' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'bookings' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'bookings' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Bookings ({activeBookings})
          </button>

          <button
            onClick={() => { setActiveTab('payments'); setSearchTerm(''); setPaymentFilter('all'); }}
            style={{
              border: 'none',
              background: activeTab === 'payments' ? '#1e1e24' : 'transparent',
              color: activeTab === 'payments' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'payments' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'payments' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Payments
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            style={{
              border: 'none',
              background: activeTab === 'operations' ? '#1e1e24' : 'transparent',
              color: activeTab === 'operations' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'operations' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'operations' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Operations
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); setOrderStatusFilter('all'); }}
            style={{
              border: 'none',
              background: activeTab === 'orders' ? '#1e1e24' : 'transparent',
              color: activeTab === 'orders' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'orders' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'orders' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Orders
          </button>

          <button
            onClick={() => { setActiveTab('menu'); setSearchTerm(''); setMenuCategoryFilter('all'); }}
            style={{
              border: 'none',
              background: activeTab === 'menu' ? '#1e1e24' : 'transparent',
              color: activeTab === 'menu' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'menu' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'menu' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Menu
          </button>

          <button
            onClick={() => { setActiveTab('crm'); setSearchTerm(''); setCrmTierFilter('all'); }}
            style={{
              border: 'none',
              background: activeTab === 'crm' ? '#1e1e24' : 'transparent',
              color: activeTab === 'crm' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'crm' ? 600 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'crm' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            CRM
          </button>

          <button
            onClick={() => { setActiveTab('themes'); setSearchTerm(''); }}
            style={{
              border: 'none',
              background: activeTab === 'themes' ? '#1e1e24' : 'transparent',
              color: activeTab === 'themes' ? '#e8bf69' : '#64748b',
              fontWeight: activeTab === 'themes' ? 700 : 500,
              fontSize: '0.84rem',
              padding: '7px 16px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'themes' ? '0 2px 8px rgba(232, 191, 105, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🎨</span>
            <span>Themes & Costs</span>
          </button>
        </div>

        {/* Right Utility Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsAssistantOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            }}
            title="Open Authorised AI Business Assistant"
          >
            <span>🤖</span>
            <span>AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={playBookingSound}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '7px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              color: '#475569',
            }}
            title="Test Sound Alert"
          >
            🔔
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fee2e2',
              borderRadius: '9999px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className={styles.loginError} style={{ margin: '0 0 24px 0', padding: '14px', fontSize: '0.9rem' }}>{error}</div>}

      {/* VIEW 1: SEWAYA-STYLE OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <SewayaOverview
          bookings={bookings}
          onSelectBooking={(b) => setSelectedBookingForInvoice(b)}
          onOpenManualBooking={() => handleOpenManualBooking()}
          onSwitchTab={(tab) => setActiveTab(tab as any)}
          onEditBooking={(b) => handleOpenEditBookingModal(b)}
          onDeleteBooking={(id) => handleDeleteBooking(id)}
        />
      )}

      {/* VIEW 2: UNIFIED LEAD MANAGEMENT */}
      {activeTab === 'leads' && (
        <LeadHub onConvertLeadToBooking={() => handleOpenManualBooking()} />
      )}

      {/* VIEW 3: EVENT OPERATIONS & SUITE READINESS */}
      {activeTab === 'operations' && (
        <OperationsHub
          bookings={bookings}
          onOpenManualBooking={(room, date) => handleOpenManualBooking(room, undefined, date)}
        />
      )}

      {/* TAB 1: BOOKINGS METRICS */}
      {activeTab === 'bookings' && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Active Reservations</div>
            <div className={styles.metricValue}>{activeBookings}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Projected Revenue</div>
            <div className={styles.metricValue} style={{ color: '#34d399' }}>₹{grossProjectedRevenue}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Theater vs Gaming</div>
            <div className={styles.metricValue} style={{ fontSize: '1.25rem', color: '#ff0055' }}>
              🎬 ₹{theaterRevenue} <span style={{ color: '#00f0ff', fontSize: '1.1rem', marginLeft: '6px' }}>🎮 ₹{gamingRevenue}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT PORTAL METRICS */}
      {activeTab === 'payments' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Gross Revenue Pipeline</div>
              <div className={styles.metricValue} style={{ color: '#10b981' }}>₹{grossProjectedRevenue + foodRevenue}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Advance Received (SBI UPI)</div>
              <div className={styles.metricValue} style={{ color: 'var(--accent)' }}>₹{totalAdvanceCollected}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Balance Due at Venue Desk</div>
              <div className={styles.metricValue} style={{ color: '#f59e0b' }}>₹{totalBalanceDue}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>SBI Verification Audit</div>
              <div className={styles.metricValue} style={{ fontSize: '1.3rem', color: '#3b82f6' }}>
                ✅ {sbiVerifiedCount} <span style={{ color: '#f87171', fontSize: '1rem', marginLeft: '6px' }}>⏳ {sbiPendingCount} Pending</span>
              </div>
            </div>
          </div>

          {/* Payment Tools Bar */}
          <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by Customer, Phone, UTR..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className={styles.dateFilter}
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'verified' | 'pending' | 'balance_due' | 'settled')}
              >
                <option value="all">📋 All Transactions</option>
                <option value="verified">✅ SBI Bank Verified</option>
                <option value="pending">⏳ Pending UTR Verification</option>
                <option value="balance_due">💵 Balance Pending at Venue</option>
                <option value="settled">✨ 100% Fully Settled</option>
              </select>
              <input
                type="date"
                className={styles.dateFilter}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {(searchTerm || dateFilter || paymentFilter !== 'all') && (
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => { setSearchTerm(''); setDateFilter(''); setPaymentFilter('all'); }}>Clear</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportPaymentLedger}
                className="btn btn-secondary"
                style={{ borderColor: '#10b981', color: '#10b981', fontSize: '0.85rem', padding: '8px 16px' }}
                title="Download CSV for accounting/Excel"
              >
                📥 Export CSV Ledger
              </button>
              <button
                type="button"
                onClick={handlePrintDayEndSettlement}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                title="Print Day-End financial statement"
              >
                🖨️ Print Day-End Settlement
              </button>
            </div>
          </div>

          {/* Payment Ledger Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Booking Reference</th>
                  <th>Customer Details</th>
                  <th>Show Date & Slot</th>
                  <th>Bill Breakdown</th>
                  <th>Payment Method & UTR</th>
                  <th>SBI Bank Verification</th>
                  <th>Venue Desk Settlement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentBookings.length > 0 ? (
                  filteredPaymentBookings.map((b) => {
                    const balance = b.balanceDue ?? Math.max(0, b.totalPrice - (b.advancePaid ?? 500));
                    return (
                      <tr key={b.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.id}</td>
                        <td>
                          <div className={styles.customerName}>{b.customerName}</div>
                          <div className={styles.customerContact}>📱 {b.phone}</div>
                          {b.specialRequests && (
                            <div style={{
                              marginTop: '4px',
                              padding: '3px 6px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              borderLeft: '2px solid #f59e0b',
                              borderRadius: '3px',
                              fontSize: '0.72rem',
                              color: '#fbbf24',
                              maxWidth: '180px',
                              wordBreak: 'break-word',
                            }}>
                              📝 {b.specialRequests}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.date}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{b.timeSlot}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold', color: '#ffffff' }}>Total: ₹{b.totalPrice}</div>
                          <div style={{ fontSize: '0.78rem', color: '#10b981' }}>Adv: ₹{b.advancePaid ?? 500}</div>
                          <div style={{ fontSize: '0.78rem', color: balance > 0 ? '#f59e0b' : '#34d399' }}>
                            {balance > 0 ? `Bal Due: ₹${balance}` : 'Fully Paid ✅'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                            UPI (NALINAKSHI C)
                          </div>
                          {b.utrNumber ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {b.utrNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUtr(b.utrNumber!, b.id)}
                                style={{ background: 'transparent', border: 'none', color: copiedUtrId === b.id ? '#10b981' : '#38bdf8', cursor: 'pointer', fontSize: '0.75rem' }}
                                title="Copy UTR number"
                              >
                                {copiedUtrId === b.id ? '✓ Copied' : '📋 Copy'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No UTR logged</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleSbiVerification(b)}
                            className={styles.actionBtn}
                            style={{
                              background: b.sbiVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: b.sbiVerified ? '#10b981' : '#f59e0b',
                              borderColor: b.sbiVerified ? '#10b981' : '#f59e0b',
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              width: '135px'
                            }}
                          >
                            {b.sbiVerified ? '✅ SBI Verified' : '⏳ Verify in Bank'}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleBalanceSettlement(b)}
                            className={styles.actionBtn}
                            style={{
                              background: b.balanceCollected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: b.balanceCollected ? '#10b981' : '#60a5fa',
                              borderColor: b.balanceCollected ? '#10b981' : '#60a5fa',
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              width: '135px'
                            }}
                          >
                            {b.balanceCollected ? '💵 Balance Paid' : 'Collect Balance'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => window.open(`/receipt?id=${b.id}`, '_blank')}
                              className={styles.actionBtn}
                              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            >
                              🧾 Receipt
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForInvoice(b)}
                              className={styles.actionBtn}
                              style={{ borderColor: '#a855f7', color: '#c084fc' }}
                            >
                              📄 Bill
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.noBookings}>No transactions found matching the selected filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 3: CRM & GUEST HUB */}
      {activeTab === 'crm' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Total Unique Guests</div>
              <div className={styles.metricValue}>{uniqueCustomersCount}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Repeat Guest Rate</div>
              <div className={styles.metricValue} style={{ color: '#10b981' }}>{repeatRate}% <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({repeatGuestsCount} guests)</span></div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>VIP Champions</div>
              <div className={styles.metricValue} style={{ color: 'var(--accent)' }}>👑 {vipGuestsCount}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Total Customer LTV</div>
              <div className={styles.metricValue} style={{ color: '#38bdf8' }}>
                ₹{crmProfiles.reduce((sum, c) => sum + c.metrics.lifetimeSpend, 0)}
              </div>
            </div>
          </div>

          {/* CRM Filter Bar */}
          <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search Guest Name, Phone, Email..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className={styles.dateFilter}
                value={crmTierFilter}
                onChange={(e) => setCrmTierFilter(e.target.value as 'all' | 'VIP' | 'REGULAR' | 'GAMER' | 'NEW')}
              >
                <option value="all">🌟 All Guest Tiers</option>
                <option value="VIP">👑 VIP Guests (High LTV)</option>
                <option value="REGULAR">⭐ Regular Repeat Guests</option>
                <option value="GAMER">🎮 PS5 Gaming Fans</option>
                <option value="NEW">✨ First-Time Guests</option>
              </select>
              {(searchTerm || crmTierFilter !== 'all') && (
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => { setSearchTerm(''); setCrmTierFilter('all'); }}>Clear</button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportCustomerCrm}
              className="btn btn-secondary"
              style={{ borderColor: '#10b981', color: '#10b981', fontSize: '0.85rem', padding: '8px 16px' }}
            >
              📥 Export Customer CRM (CSV)
            </button>
          </div>

          {/* Customers Directory Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Loyalty Tier</th>
                  <th>Visits & History</th>
                  <th>Lifetime Spend (CLV)</th>
                  <th>Last Celebration</th>
                  <th>1-Click WhatsApp CRM Outreach</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrmProfiles.length > 0 ? (
                  filteredCrmProfiles.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className={styles.customerName}>{c.name}</div>
                        <div className={styles.customerContact}>
                          📱 {c.phone} {c.email && <><br />📧 {c.email}</>}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '4px 10px',
                          borderRadius: '50px',
                          background: c.metrics.calculatedSegment === 'VIP' ? 'rgba(255, 0, 85, 0.15)' : c.metrics.calculatedSegment === 'REGULAR' ? 'rgba(16, 185, 129, 0.15)' : c.metrics.calculatedSegment === 'GAMER' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.08)',
                          color: c.metrics.calculatedSegment === 'VIP' ? '#ff0055' : c.metrics.calculatedSegment === 'REGULAR' ? '#10b981' : c.metrics.calculatedSegment === 'GAMER' ? '#00f0ff' : 'var(--text-secondary)',
                          border: '1px solid currentColor'
                        }}>
                          {c.metrics.calculatedSegment === 'VIP' ? '👑 VIP' : c.metrics.calculatedSegment === 'REGULAR' ? '⭐ REGULAR' : c.metrics.calculatedSegment === 'GAMER' ? '🎮 GAMER' : '✨ NEW'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.metrics.totalBookings} Booking(s)</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.foodOrderHistory.length} Food Order(s)</div>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.05rem' }}>
                        ₹{c.metrics.lifetimeSpend}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.metrics.lastVisitAt || 'Recent'}</div>
                        {c.notes.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '2px' }}>
                            💬 {c.notes.length} Note(s)
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleTriggerWhatsAppCampaign(c, 'birthday_voucher')}
                            className={styles.actionBtn}
                            style={{ background: 'rgba(255, 0, 85, 0.1)', color: '#ff0055', borderColor: 'rgba(255, 0, 85, 0.3)' }}
                            title="Send Birthday Wish with ₹200 Voucher"
                          >
                            🎂 Voucher
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerWhatsAppCampaign(c, 'review_request')}
                            className={styles.actionBtn}
                            style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                            title="Request 5-Star Google Review"
                          >
                            ⭐ Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerWhatsAppCampaign(c, 'we_miss_you')}
                            className={styles.actionBtn}
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            title="Send 'We Miss You' Snack Platter Offer"
                          >
                            🍿 Miss You
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectWhatsAppChat(c.phone, c.name)}
                            className={styles.actionBtn}
                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                            title="Direct WhatsApp Chat"
                          >
                            💬 Chat
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => { setSelectedCustomer(c); setIsCustomerDrawerOpen(true); }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          👁️ Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.noBookings}>No customer profiles found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 1: BOOKINGS TABLE */}
      {activeTab === 'bookings' && (
        <>
          <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by Name, Booking ID, Phone..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className={styles.dateFilter}
                value={bookingCategoryFilter}
                onChange={(e) => setBookingCategoryFilter(e.target.value as 'all' | 'theater' | 'gaming')}
              >
                <option value="all">📋 All Categories ({activeBookings})</option>
                <option value="theater">🎬 Celebration Theater</option>
                <option value="gaming">🎮 PS5 Gaming Lounge</option>
              </select>
              <select
                className={styles.dateFilter}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                style={{ minWidth: '150px' }}
              >
                <option value="all">🌐 All Booking Sources</option>
                <option value="Website">🌐 Website Direct</option>
                <option value="WhatsApp">💬 WhatsApp Booking</option>
                <option value="Phone Call">📞 Phone Reservation</option>
                <option value="Walk-in">🚶 Walk-in Counter</option>
              </select>
              <input
                type="date"
                className={styles.dateFilter}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {(searchTerm || dateFilter || bookingCategoryFilter !== 'all' || sourceFilter !== 'all') && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => { setSearchTerm(''); setDateFilter(''); setBookingCategoryFilter('all'); setSourceFilter('all'); }}
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleOpenManualBooking()}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 100%)',
                border: 'none',
              }}
            >
              ✍️ + Add Manual Booking
            </button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Booking Reference & Source</th>
                  <th>Customer Details</th>
                  <th>Show Date & Time</th>
                  <th>Package & Add-ons</th>
                  <th>Total Bill</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className={newlyAddedIds.includes(b.id) ? styles.newRowHighlight : ''}>
                      <td style={{ fontFamily: 'monospace' }}>
                        <div style={{ fontWeight: 'bold' }}>{b.id}</div>
                        <div style={{ marginTop: '4px' }}>
                          {b.source === 'WhatsApp' ? (
                            <span className={`${styles.sourceBadge} ${styles.sourceBadgeWhatsApp}`}>💬 WhatsApp</span>
                          ) : b.source === 'Phone Call' ? (
                            <span className={`${styles.sourceBadge} ${styles.sourceBadgePhone}`}>📞 Phone</span>
                          ) : b.source === 'Walk-in' ? (
                            <span className={`${styles.sourceBadge} ${styles.sourceBadgeWalkIn}`}>🚶 Walk-in</span>
                          ) : (
                            <span className={`${styles.sourceBadge} ${styles.sourceBadgeWebsite}`}>🌐 Website</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.customerName}>{b.customerName}</div>
                        <div className={styles.customerContact}>📱 {b.phone} <br />👥 {b.guestCount} Guests</div>
                        {b.specialRequests && (
                          <div style={{
                            marginTop: '6px',
                            padding: '4px 8px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            borderLeft: '3px solid #f59e0b',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            color: '#fbbf24',
                            lineHeight: 1.3,
                            maxWidth: '220px',
                            wordBreak: 'break-word',
                          }}>
                            <span style={{ fontWeight: 700 }}>📝 Note:</span> {b.specialRequests}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.date}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.timeSlot}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: b.bookingType === 'gaming' || b.packageName.includes('Gaming') ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 0, 85, 0.15)', color: b.bookingType === 'gaming' || b.packageName.includes('Gaming') ? '#00f0ff' : '#ff0055' }}>
                          {b.bookingType === 'gaming' || b.packageName.includes('Gaming') ? '🎮 GAMING' : '🎬 THEATER'}
                        </span>
                        <div style={{ fontWeight: 500, marginTop: '4px' }}>{b.packageName}</div>
                        {b.addOns && b.addOns.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '2px' }}>
                            +{b.addOns.join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                        <div>₹{b.totalPrice}</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Adv: ₹{b.advancePaid ?? 500}</div>
                        {b.balanceDue !== undefined && b.balanceDue > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Bal: ₹{b.balanceDue}</div>
                        )}
                        {b.couponCode && (
                          <div style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 600, marginTop: '2px' }}>
                            🎟️ {b.couponCode}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${b.status === 'confirmed' ? styles.badgeConfirmed : b.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {b.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                              className={`${styles.actionBtn} ${styles.btnSuccess}`}
                              title="Confirm booking"
                            >
                              ✓ Confirm
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                              className={`${styles.actionBtn} ${styles.btnWarning}`}
                              title="Cancel booking"
                            >
                              ✕ Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(b)}
                            className={styles.actionBtn}
                            style={{ borderColor: '#10b981', color: '#10b981' }}
                            title="Collect balance or view payment ledger"
                          >
                            💵 Pay
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(`/receipt?id=${b.id}`, '_blank')}
                            className={styles.actionBtn}
                            title="View online receipt"
                          >
                            🧾 Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForInvoice(b)}
                            className={styles.actionBtn}
                            style={{ borderColor: '#a855f7', color: '#c084fc' }}
                            title="Generate and print bill"
                          >
                            📄 Bill
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditBookingModal(b)}
                            className={styles.actionBtn}
                            style={{ borderColor: '#3b82f6', color: '#60a5fa' }}
                            title="Edit booking details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b.id)}
                            className={`${styles.actionBtn} ${styles.btnDanger}`}
                            title="Delete booking"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={styles.noBookings}>No bookings found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 2: VISUAL BOOKING CALENDAR */}
      {activeTab === 'calendar' && (
        <div className={styles.calendarContainer}>
          <div className={styles.calendarNav}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>
                📅 Room Availability & Occupancy Grid
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => {
                    const d = new Date(calendarViewDate);
                    d.setDate(d.getDate() - 1);
                    setCalendarViewDate(d.toISOString().slice(0, 10));
                  }}
                  title="Previous Day"
                >
                  ◀ Prev
                </button>
                <input
                  type="date"
                  className={styles.dateFilter}
                  value={calendarViewDate}
                  onChange={(e) => setCalendarViewDate(e.target.value)}
                  style={{ minWidth: '150px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => {
                    const d = new Date(calendarViewDate);
                    d.setDate(d.getDate() + 1);
                    setCalendarViewDate(d.toISOString().slice(0, 10));
                  }}
                  title="Next Day"
                >
                  Next ▶
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setCalendarViewDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()))}
                >
                  Today
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenManualBooking('angel-wings', undefined, calendarViewDate)}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 100%)',
                border: 'none',
              }}
            >
              ✍️ + Book This Date
            </button>
          </div>

          <div className={styles.calendarGrid}>
            {ROOMS.map((room) => {
              const isGaming = room.id === 'ps5-gaming';
              const slots = isGaming ? [
                '10:00 AM - 11:00 AM',
                '11:00 AM - 12:00 PM',
                '12:00 PM - 01:00 PM',
                '01:00 PM - 02:00 PM',
                '02:00 PM - 03:00 PM',
                '03:00 PM - 04:00 PM',
                '04:00 PM - 05:00 PM',
                '05:00 PM - 06:00 PM',
                '06:00 PM - 07:00 PM',
                '07:00 PM - 08:00 PM',
                '08:00 PM - 09:00 PM',
                '09:00 PM - 10:00 PM',
                '10:00 PM - 11:00 PM',
                '11:00 PM - 12:00 AM',
              ] : [
                '10:00 AM - 11:30 AM',
                '12:00 PM - 01:30 PM',
                '02:00 PM - 03:30 PM',
                '04:00 PM - 05:30 PM',
                '06:00 PM - 07:30 PM',
                '08:00 PM - 09:30 PM',
                '10:00 PM - 11:30 PM',
                '12:00 AM - 01:30 AM',
              ];

              const roomBookings = bookings.filter(b => {
                if (b.status === 'cancelled') return false;
                if (b.date !== calendarViewDate) return false;
                return normalizeRoomId(b) === room.id;
              });

              const themeColor = room.id === 'angel-wings' ? '#ec4899' : room.id === 'red-velvet' ? '#ef4444' : room.id === 'royal-butterfly' ? '#a855f7' : '#06b6d4';

              return (
                <div key={room.id} className={styles.calendarRoomCol}>
                  <div className={styles.calendarRoomHeader} style={{ borderTop: `3px solid ${themeColor}` }}>
                    <div>
                      <div style={{ color: themeColor, fontWeight: 700 }}>{room.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{room.occasionLabel} · {room.duration}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '12px' }}>
                      {roomBookings.length} Booked
                    </span>
                  </div>

                  <div className={styles.calendarSlotsList}>
                    {slots.map((slotTime) => {
                      const matchedBooking = roomBookings.find(b => checkBookingOverlap(calendarViewDate, slotTime, [b]));

                      if (matchedBooking) {
                        const balance = matchedBooking.balanceDue ?? Math.max(0, matchedBooking.totalPrice - (matchedBooking.advancePaid ?? 500));
                        return (
                          <div key={slotTime} className={styles.calendarSlotBooked} style={{ borderLeftColor: themeColor }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>⏰ {slotTime}</span>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: matchedBooking.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: matchedBooking.status === 'confirmed' ? '#10b981' : '#f59e0b',
                                fontWeight: 600,
                              }}>
                                {matchedBooking.status}
                              </span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f3f4f6' }}>
                              👤 {matchedBooking.customerName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              📱 {matchedBooking.phone} · 👥 {matchedBooking.guestCount} Guests
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{matchedBooking.totalPrice}</span>
                              <span style={{ color: balance > 0 ? '#f59e0b' : '#10b981' }}>
                                {balance > 0 ? `Bal: ₹${balance}` : 'Paid ✅'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(matchedBooking)}
                                className={styles.actionBtn}
                                style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: '#10b981', color: '#10b981' }}
                              >
                                💵 Pay
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedBookingForInvoice(matchedBooking)}
                                className={styles.actionBtn}
                                style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: '#a855f7', color: '#c084fc' }}
                              >
                                📄 Bill
                              </button>
                              <button
                                type="button"
                                onClick={() => window.open(`/receipt?id=${matchedBooking.id}`, '_blank')}
                                className={styles.actionBtn}
                                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                              >
                                🧾
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={slotTime} className={styles.calendarSlotAvailable}>
                          <div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9ca3af' }}>{slotTime}</span>
                            <span style={{ fontSize: '0.72rem', color: '#10b981', marginLeft: '8px' }}>• Free</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenManualBooking(room.id, slotTime, calendarViewDate)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: '#10b981', color: '#10b981' }}
                          >
                            + Book
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FOOD ORDERS */}
      {activeTab === 'orders' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Active Orders</div>
              <div className={styles.metricValue} style={{ color: 'var(--accent)' }}>{activeOrdersCount}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Completed Deliveries</div>
              <div className={styles.metricValue}>{servedOrdersCount}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Food Sales Revenue</div>
              <div className={styles.metricValue} style={{ color: '#10b981' }}>₹{foodRevenue}</div>
            </div>
          </div>

          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="Search by Order ID, Room, Customer..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className={styles.dateFilter}
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">📋 All Statuses</option>
                <option value="pending">⏳ Pending ({orders.filter(o => o.status === 'pending').length})</option>
                <option value="preparing">🍳 Preparing ({orders.filter(o => o.status === 'preparing').length})</option>
                <option value="served">✅ Served ({orders.filter(o => o.status === 'served').length})</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              <input
                type="date"
                className={styles.dateFilter}
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value)}
              />
            </div>
            {(searchTerm || orderDateFilter || orderStatusFilter !== 'all') && (
              <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => { setSearchTerm(''); setOrderDateFilter(''); setOrderStatusFilter('all'); }}>Clear</button>
            )}
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Room Source</th>
                  <th>Items Ordered</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Order Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace' }}>{o.id}</td>
                      <td>
                        <span className={`${styles.roomThemeBadge} ${o.theme === 'pink' ? styles.roomThemePink : o.theme === 'purple' ? styles.roomThemePurple : styles.roomThemeRed}`}>
                          {o.themeLabel || o.theme}
                        </span>
                        {o.customerName && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Guest: {o.customerName}</div>}
                        {o.notes && (
                          <div style={{
                            marginTop: '4px',
                            padding: '3px 6px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderLeft: '2px solid #f59e0b',
                            borderRadius: '3px',
                            fontSize: '0.74rem',
                            color: '#fbbf24',
                            maxWidth: '220px',
                            wordBreak: 'break-word',
                          }}>
                            📝 Note: {o.notes}
                          </div>
                        )}
                      </td>
                      <td>{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{o.totalPrice}</td>
                      <td>
                        <span className={`${styles.badge} ${o.status === 'served' ? styles.badgeConfirmed : o.status === 'preparing' ? styles.badgePreparing : o.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(o.id, 'preparing')}
                              className={`${styles.actionBtn} ${styles.btnWarning}`}
                              title="Mark order as preparing in kitchen"
                            >
                              🍳 Start Prep
                            </button>
                          )}
                          {o.status === 'preparing' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(o.id, 'served')}
                              className={`${styles.actionBtn} ${styles.btnSuccess}`}
                              title="Mark order as served to room"
                            >
                              ✅ Mark Served
                            </button>
                          )}
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')}
                              className={`${styles.actionBtn} ${styles.btnDanger}`}
                              title="Cancel order"
                            >
                              ✕ Cancel
                            </button>
                          )}
                          {o.status === 'served' && (
                            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                              ✓ Delivered
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(o.id)}
                            className={`${styles.actionBtn} ${styles.btnDanger}`}
                            title="Delete food order"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className={styles.noBookings}>No food orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 5: MENU MANAGER */}
      {activeTab === 'menu' && (
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Total Menu Items</div>
              <div className={styles.metricValue}>{menuItems.length}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>In Stock</div>
              <div className={styles.metricValue} style={{ color: '#10b981' }}>
                {menuItems.filter(m => m.inStock).length}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricTitle}>Out of Stock</div>
              <div className={styles.metricValue} style={{ color: '#f87171' }}>
                {menuItems.filter(m => !m.inStock).length}
              </div>
            </div>
          </div>

          {/* Menu Action & Filter Bar */}
          <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search dish or beverage..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className={styles.dateFilter}
                value={menuCategoryFilter}
                onChange={(e) => setMenuCategoryFilter(e.target.value as 'all' | 'snacks' | 'beverages' | 'desserts')}
              >
                <option value="all">🌟 All Categories</option>
                <option value="snacks">🍿 Snacks</option>
                <option value="beverages">🥤 Beverages</option>
                <option value="desserts">🍨 Desserts</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddMenuModal}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '8px 18px' }}
            >
              ➕ Add New Menu Item
            </button>
          </div>

          {/* Menu Items Grid */}
          <div className={styles.menuItemsGrid}>
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.menuCard} ${!item.inStock ? styles.menuCardOutStock : ''}`}
                  onClick={() => handleOpenEditMenuModal(item)}
                >
                  <div className={styles.menuCardHeader}>
                    <span className={styles.menuCardIcon}>{item.icon || '🍿'}</span>
                    <div className={styles.menuCardInfo}>
                      <div className={styles.menuCardName}>{item.name}</div>
                      <div className={styles.menuCardPrice}>₹{item.price}</div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)'
                    }}>
                      {item.category}
                    </span>
                  </div>

                  <div className={styles.menuCardDesc}>
                    {item.description || 'No description provided.'}
                  </div>

                  <div className={styles.menuCardFooter}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStock(item);
                      }}
                      className={`${styles.stockToggleBtn} ${item.inStock ? styles.stockIn : styles.stockOut}`}
                    >
                      {item.inStock ? '● In Stock' : '○ Out of Stock'}
                    </button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditMenuModal(item);
                        }}
                        className={styles.actionBtn}
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMenuItem(item.id);
                        }}
                        className={`${styles.actionBtn} ${styles.btnDanger}`}
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No menu items found. Click &quot;Add New Menu Item&quot; to create one!
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB: THEMES & COSTS MANAGER */}
      {activeTab === 'themes' && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {/* Header Action Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(232, 191, 105, 0.12) 0%, rgba(18, 18, 24, 0.9) 100%)',
            border: '1px solid rgba(232, 191, 105, 0.3)',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.6rem' }}>🎨</span>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>
                  Celebration Suite Themes, Imagery & Pricing
                </h2>
                <span style={{
                  background: 'rgba(232, 191, 105, 0.2)',
                  color: '#e8bf69',
                  border: '1px solid rgba(232, 191, 105, 0.4)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Live Sync
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '750px', lineHeight: 1.5 }}>
                Directly manage cover photos, gallery images, base booking prices (1 Hr 30 Mins standard slots), and extra guest charges. Saved changes update live on the website and booking calculations.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fetchThemes()}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 16px', borderRadius: '8px' }}
                title="Refresh latest themes from database"
              >
                🔄 Refresh Themes
              </button>
            </div>
          </div>

          {/* Suites Grid */}
          <div className={styles.themesGrid}>
            {themesList.map((theme) => {
              const edit = editingThemeImages[theme.id] || {
                image: theme.image,
                galleryImages: theme.galleryImages || [theme.image],
                price: theme.price,
                extraGuestPrice: theme.extraGuestPrice ?? 100,
                description: theme.description,
                duration: theme.duration || '1 Hr 30 Mins',
              };

              const isSaving = savingThemeId === theme.id;
              const feedback = themeFeedback?.id === theme.id ? themeFeedback : null;

              // Color accents
              const themeGlow = theme.id === 'angel-wings'
                ? 'rgba(244, 114, 182, 0.2)'
                : theme.id === 'red-velvet'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(168, 85, 247, 0.2)';

              const themeBorder = theme.id === 'angel-wings'
                ? 'rgba(244, 114, 182, 0.4)'
                : theme.id === 'red-velvet'
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(168, 85, 247, 0.4)';

              const themeBadgeBg = theme.id === 'angel-wings'
                ? '#f472b6'
                : theme.id === 'red-velvet'
                ? '#ef4444'
                : '#a855f7';

              return (
                <div
                  key={theme.id}
                  className={styles.themeManagerCard}
                  style={{ borderColor: themeBorder, boxShadow: `0 8px 30px ${themeGlow}` }}
                >
                  {/* Card Header */}
                  <div className={styles.themeCardHeader}>
                    <div>
                      <div className={styles.themeCardTitle}>{theme.name}</div>
                      <div className={styles.themeCardSubtitle}>
                        {theme.occasionLabel} • {theme.capacity || 'Up to 6 Guests'}
                      </div>
                    </div>
                    <span
                      className={styles.themeCardBadge}
                      style={{ background: themeBadgeBg, color: '#ffffff' }}
                    >
                      {theme.id === 'royal-butterfly' ? 'VIP Suite' : theme.id === 'red-velvet' ? 'Couples Pick' : 'Birthday Pick'}
                    </span>
                  </div>

                  {/* Visual Cover Preview */}
                  <div className={styles.themePreviewBanner}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={edit.image}
                      alt={theme.name}
                      className={styles.themePreviewImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = theme.image || '/gallery/theme-pink.jpg';
                      }}
                    />
                    <div className={styles.themePreviewOverlay}>
                      <span>🖼️ Cover Photo</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.themeCardBody}>
                    {/* Pricing Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className={styles.themeSectionLabel}>
                          <span>💰 Base Price (₹)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: 700 }}>₹</span>
                          <input
                            type="number"
                            required
                            min={1}
                            className={styles.formInputCustom}
                            style={{ paddingLeft: '28px', fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}
                            value={edit.price}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditingThemeImages(prev => ({
                                ...prev,
                                [theme.id]: { ...edit, price: val }
                              }));
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                          For {theme.duration || '1 Hr 30 Mins'} (2 guests)
                        </span>
                      </div>

                      <div>
                        <label className={styles.themeSectionLabel}>
                          <span>👥 Extra Guest (₹)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#e8bf69', fontWeight: 700 }}>₹</span>
                          <input
                            type="number"
                            min={0}
                            className={styles.formInputCustom}
                            style={{ paddingLeft: '28px', fontSize: '1.1rem', fontWeight: 700, color: '#e8bf69' }}
                            value={edit.extraGuestPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditingThemeImages(prev => ({
                                ...prev,
                                [theme.id]: { ...edit, extraGuestPrice: val }
                              }));
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                          Per person above 2 guests
                        </span>
                      </div>
                    </div>

                    {/* Cover Image URL */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className={styles.themeSectionLabel} style={{ margin: 0 }}>
                          <span>🖼️ Cover Photo URL</span>
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultPreset = theme.id === 'angel-wings'
                                ? '/gallery/theme-pink.jpg'
                                : theme.id === 'red-velvet'
                                ? '/gallery/theme-red.jpg'
                                : '/gallery/theme-purple.jpg';
                              setEditingThemeImages(prev => ({
                                ...prev,
                                [theme.id]: { ...edit, image: defaultPreset }
                              }));
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: '#cbd5e1',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title="Reset to default local image"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className={styles.formInputCustom}
                        placeholder="e.g. /gallery/theme-pink.jpg or https://..."
                        value={edit.image}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingThemeImages(prev => ({
                            ...prev,
                            [theme.id]: { ...edit, image: val }
                          }));
                        }}
                      />
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className={styles.themeSectionLabel} style={{ margin: 0 }}>
                          <span>📸 Gallery Images ({edit.galleryImages?.length || 0})</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newImg = prompt('Enter image URL for gallery (e.g. /gallery/my-photo.jpg or https://...):');
                            if (newImg && newImg.trim()) {
                              setEditingThemeImages(prev => ({
                                ...prev,
                                [theme.id]: {
                                  ...edit,
                                  galleryImages: [...(edit.galleryImages || []), newImg.trim()]
                                }
                              }));
                            }
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          ➕ Add Photo
                        </button>
                      </div>

                      {/* Gallery Thumbnails List */}
                      {edit.galleryImages && edit.galleryImages.length > 0 && (
                        <div className={styles.galleryThumbRow}>
                          {edit.galleryImages.map((gImg, idx) => (
                            <div key={idx} className={styles.galleryThumbItem} title={`${gImg} (Click to set as cover)`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={gImg}
                                alt="Gallery item"
                                className={styles.galleryThumbImg}
                                onClick={() => {
                                  setEditingThemeImages(prev => ({
                                    ...prev,
                                    [theme.id]: { ...edit, image: gImg }
                                  }));
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <button
                                type="button"
                                className={styles.galleryThumbRemove}
                                title="Remove photo"
                                onClick={() => {
                                  const updated = edit.galleryImages.filter((_, i) => i !== idx);
                                  setEditingThemeImages(prev => ({
                                    ...prev,
                                    [theme.id]: { ...edit, galleryImages: updated }
                                  }));
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                        Tip: Click any gallery thumbnail to quickly set it as the main Cover Photo!
                      </span>
                    </div>

                    {/* Description / Neon Highlights */}
                    <div>
                      <label className={styles.themeSectionLabel}>
                        <span>✨ Theme Features & Neon Details</span>
                      </label>
                      <textarea
                        rows={3}
                        className={styles.formTextareaCustom}
                        style={{ fontSize: '0.85rem', lineHeight: 1.4 }}
                        value={edit.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingThemeImages(prev => ({
                            ...prev,
                            [theme.id]: { ...edit, description: val }
                          }));
                        }}
                      />
                    </div>

                    {/* Feedback Alert */}
                    {feedback && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        color: feedback.type === 'success' ? '#34d399' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
                        <span>{feedback.msg}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer with Save Button */}
                  <div className={styles.themeCardFooter}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ID: <code>{theme.id}</code>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveTheme(theme.id)}
                      className="btn btn-primary"
                      style={{
                        padding: '8px 20px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: isSaving ? '#64748b' : 'linear-gradient(135deg, #e8bf69 0%, #ddaf52 100%)',
                        color: '#30211f',
                        boxShadow: '0 4px 14px rgba(232, 191, 105, 0.35)',
                      }}
                    >
                      {isSaving ? (
                        <>
                          <span>⏳</span>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span>
                          <span>Save Theme & Price</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: QR STANDEES */}
      {activeTab === 'qrs' && (
        <div className={styles.qrGridContainer}>
          <div className={styles.qrStandeesList}>
            {(['pink', 'purple', 'red'] as const).map((color) => {
              const themeName = color === 'pink' ? 'Rose Pink Theme' : color === 'purple' ? 'Neon Purple Theme' : 'Crimson Red Theme';
              const hostOrigin = typeof window !== 'undefined' ? window.location.origin : '';
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(hostOrigin + '/menu?theme=' + color)}`;
              return (
                <div key={color} className={`${styles.qrCard} ${color === 'pink' ? styles.qrCardPink : color === 'purple' ? styles.qrCardPurple : styles.qrCardRed}`}>
                  <div className={styles.qrCardHeader}>
                    <h3>{themeName} Room</h3>
                  </div>
                  <div className={styles.qrCardBody}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt={themeName} width={140} height={140} style={{ margin: '0 auto', display: 'block', borderRadius: '8px' }} />
                  </div>
                  <div className={styles.qrCardFooter}>
                    <button onClick={() => handlePrintStandee(color)} className="btn btn-primary" style={{ width: '100%' }}>
                      🖨️ Print Standee
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT MENU ITEM MODAL */}
      {isMenuModalOpen && (
        <div className={styles.modalOverlayCustom} onClick={() => setIsMenuModalOpen(false)}>
          <div className={styles.modalContentCustom} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCustom}>
              <h3>{editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button className={styles.closeBtnCustom} onClick={() => setIsMenuModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitMenuItem}>
              <div className={styles.modalBodyCustom}>
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabelCustom}>Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cheese Popcorn"
                    className={styles.formInputCustom}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 100"
                      className={styles.formInputCustom}
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Category</label>
                    <select
                      className={styles.formInputCustom}
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as 'snacks' | 'beverages' | 'desserts')}
                    >
                      <option value="snacks">🍿 Snacks</option>
                      <option value="beverages">🥤 Beverages</option>
                      <option value="desserts">🍨 Desserts</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabelCustom}>Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="🍿, 🥤, 🍟, 🍔, ☕"
                    className={styles.formInputCustom}
                    value={itemIcon}
                    onChange={(e) => setItemIcon(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabelCustom}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Delicious snacks served warm..."
                    className={styles.formTextareaCustom}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooterCustom}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMenuModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={menuSubmitting} style={{ flex: 1 }}>
                  {menuSubmitting ? 'Saving...' : editingMenuItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILL / INVOICE GENERATOR MODAL */}
      {selectedBookingForInvoice && (
        <div className={styles.modalOverlayCustom} onClick={() => setSelectedBookingForInvoice(null)}>
          <div className={styles.invoiceModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCustom}>
              <h3>Tax Invoice & Receipt · #{selectedBookingForInvoice.id}</h3>
              <button className={styles.closeBtnCustom} onClick={() => setSelectedBookingForInvoice(null)}>✕</button>
            </div>

            <div className={styles.invoicePaper} id="printable-bill-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>🐝 Bee Vibe Cinema</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Private Celebration Theater & PS5 Gaming Lounge</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Bangalore, Karnataka · support@beevibe.org</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>TAX INVOICE</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>#{selectedBookingForInvoice.id}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Date: {selectedBookingForInvoice.date}</div>
                </div>
              </div>

              {/* Customer & Slot Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Billed To</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{selectedBookingForInvoice.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>📱 {selectedBookingForInvoice.phone}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>📧 {selectedBookingForInvoice.email}</div>
                  <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
                    Source: {selectedBookingForInvoice.source || 'Website'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Show Schedule</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>📅 {selectedBookingForInvoice.date}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>⏰ {selectedBookingForInvoice.timeSlot}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>👥 {selectedBookingForInvoice.guestCount} Guests</div>
                </div>
              </div>

              {selectedBookingForInvoice.specialRequests && (
                <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', borderLeft: '3px solid #d97706', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>📝 Customer Note / Special Request:</strong>
                  <span style={{ color: '#78350f' }}>&ldquo;{selectedBookingForInvoice.specialRequests}&rdquo;</span>
                </div>
              )}

              {/* Itemized Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#334155' }}>Description</th>
                    <th style={{ padding: '10px 12px', color: '#334155', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <strong>{selectedBookingForInvoice.packageName}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Standard Private Suite Experience</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                      ₹{selectedBookingForInvoice.totalPrice - (selectedBookingForInvoice.addOns?.length ? selectedBookingForInvoice.addOns.length * 200 : 0)}
                    </td>
                  </tr>
                  {selectedBookingForInvoice.addOns && selectedBookingForInvoice.addOns.map((add, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        + Add-on: {add}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                        Included
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                    <td style={{ padding: '12px' }}>Total Amount</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontSize: '1.1rem' }}>₹{selectedBookingForInvoice.totalPrice}</td>
                  </tr>
                  {selectedBookingForInvoice.couponCode && (
                    <tr style={{ color: '#16a34a', fontWeight: 600 }}>
                      <td style={{ padding: '6px 12px' }}>Coupon Applied ({selectedBookingForInvoice.couponCode})</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>- ₹{selectedBookingForInvoice.discountAmount || 0}</td>
                    </tr>
                  )}
                  <tr style={{ color: '#059669', fontWeight: 600 }}>
                    <td style={{ padding: '6px 12px' }}>Advance Paid ({selectedBookingForInvoice.paymentMode || 'UPI'})</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>- ₹{selectedBookingForInvoice.advancePaid ?? 500}</td>
                  </tr>
                  <tr style={{ color: selectedBookingForInvoice.balanceCollected ? '#059669' : '#d97706', fontWeight: 800, fontSize: '1.05rem', borderTop: '1px dashed #cbd5e1' }}>
                    <td style={{ padding: '12px' }}>Balance Due at Desk</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {selectedBookingForInvoice.balanceCollected
                        ? '₹0 (Settled ✅)'
                        : `₹${selectedBookingForInvoice.balanceDue ?? Math.max(0, selectedBookingForInvoice.totalPrice - (selectedBookingForInvoice.advancePaid ?? 500))}`}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Payment Ledger History */}
              {selectedBookingForInvoice.paymentLedger && selectedBookingForInvoice.paymentLedger.length > 0 && (
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Payment Transaction History:
                  </div>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      {selectedBookingForInvoice.paymentLedger.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4px 6px', color: '#64748b' }}>
                            {new Date(p.recordedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#0f172a' }}>{p.paymentMode} ({p.type})</td>
                          <td style={{ padding: '4px 6px', color: '#64748b' }}>{p.utrNumber ? `Ref: ${p.utrNumber}` : (p.notes || '')}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>₹{p.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                Thank you for celebrating with Bee Vibe Party Hall! For inquiries call +91 99001 06474.
              </div>
            </div>

            <div className={styles.modalFooterCustom}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedBookingForInvoice(null)}
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const printContents = document.getElementById('printable-bill-area')?.innerHTML;
                  if (!printContents) return;
                  const win = window.open('', '_blank');
                  if (!win) {
                    alert('Popup blocked.');
                    return;
                  }
                  win.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Invoice - ${selectedBookingForInvoice.id}</title>
                        <style>
                          body { font-family: sans-serif; padding: 20px; color: #1e293b; }
                        </style>
                      </head>
                      <body>
                        ${printContents}
                        <script>
                          window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
                        </script>
                      </body>
                    </html>
                  `);
                  win.document.close();
                }}
                style={{ flex: 1 }}
              >
                🖨️ Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL PROFILE DRAWER */}
      {isCustomerDrawerOpen && selectedCustomer && (
        <div className={styles.modalOverlayCustom} onClick={() => setIsCustomerDrawerOpen(false)}>
          <div className={styles.drawerContentCustom} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h2>{selectedCustomer.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  📱 {selectedCustomer.phone} {selectedCustomer.email && <>· 📧 {selectedCustomer.email}</>}
                </div>
              </div>
              <button className={styles.closeBtnCustom} onClick={() => setIsCustomerDrawerOpen(false)}>✕</button>
            </div>

            <div className={styles.drawerBody}>
              {/* Profile Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div className={styles.drawerKpi}>
                  <div className={styles.drawerKpiLabel}>Tier</div>
                  <div className={styles.drawerKpiVal} style={{ color: 'var(--accent)' }}>{selectedCustomer.metrics.calculatedSegment}</div>
                </div>
                <div className={styles.drawerKpi}>
                  <div className={styles.drawerKpiLabel}>Total Visits</div>
                  <div className={styles.drawerKpiVal}>{selectedCustomer.metrics.totalBookings}</div>
                </div>
                <div className={styles.drawerKpi}>
                  <div className={styles.drawerKpiLabel}>Lifetime Value</div>
                  <div className={styles.drawerKpiVal} style={{ color: '#10b981' }}>₹{selectedCustomer.metrics.lifetimeSpend}</div>
                </div>
              </div>

              {/* Private Staff CRM Notes */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>📝 Private Staff Notes</h3>
                <form onSubmit={handleAddCrmNote} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Add customer note (e.g. loves caramel popcorn, anniversary couple)..."
                    className={styles.searchInput}
                    style={{ flex: 1 }}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    disabled={noteSubmitting}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} disabled={noteSubmitting}>
                    {noteSubmitting ? 'Saving...' : 'Add Note'}
                  </button>
                </form>

                {selectedCustomer.notes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomer.notes.map((n) => (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#ffffff' }}>{n.note}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          By {n.authorUserId} · {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No notes yet. Add one above!</div>
                )}
              </div>

              {/* Booking History Timeline */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>🎬 Celebration Timeline ({selectedCustomer.bookingHistory.length})</h3>
                {selectedCustomer.bookingHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedCustomer.bookingHistory.map((b) => (
                      <div key={b.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{b.packageName}</strong>
                          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{b.totalPrice}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          📅 {b.date} · ⏰ {b.timeSlot} · 👥 {b.guestCount} Guests
                        </div>
                        {b.addOns && b.addOns.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>
                            Add-ons: {b.addOns.join(', ')}
                          </div>
                        )}
                        {b.specialRequests && (
                          <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', borderLeft: '2px solid #f59e0b' }}>
                            📝 Customer Request: &ldquo;{b.specialRequests}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No reservation history found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: MANUAL BOOKING MODAL */}
      {isManualBookingModalOpen && (
        <div className={styles.modalOverlayCustom} onClick={() => setIsManualBookingModalOpen(false)}>
          <div className={`${styles.modalContentCustom} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCustom}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✍️ Add Manual Booking (Staff Desk)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Saves directly to database · Immediately blocks slots on live website
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtnCustom}
                onClick={() => setIsManualBookingModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitManualBooking}>
              <div className={styles.modalBodyCustom}>
                {manualError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
                    ⚠️ {manualError}
                  </div>
                )}

                {/* Booking Source Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabelCustom}>Booking Source</label>
                  <div className={styles.pillsRow}>
                    {(['Walk-in', 'WhatsApp', 'Phone Call', 'Website'] as const).map((src) => (
                      <button
                        type="button"
                        key={src}
                        className={`${styles.pillBtn} ${manualSource === src ? styles.pillBtnActive : ''}`}
                        onClick={() => setManualSource(src)}
                      >
                        {src === 'WhatsApp' ? '💬 WhatsApp' : src === 'Phone Call' ? '📞 Phone Call' : src === 'Walk-in' ? '🚶 Walk-in Desk' : '🌐 Website Direct'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Details Grid */}
                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className={styles.formInputCustom}
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Customer Phone (10 Digits) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      className={styles.formInputCustom}
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Customer Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      className={styles.formInputCustom}
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Guest Count (Base includes 2)</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      className={styles.formInputCustom}
                      value={manualGuests}
                      onChange={(e) => {
                        const count = parseInt(e.target.value, 10) || 1;
                        setManualGuests(count);
                        const newPrice = calculatePriceForManualBooking(manualRoomId, count, manualAddOns, manualTimeSlot);
                        setManualTotalPrice(newPrice);
                      }}
                    />
                  </div>
                </div>

                {/* Room / Service Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabelCustom}>Celebration Suite / Service *</label>
                  <select
                    className={styles.formInputCustom}
                    value={manualRoomId}
                    onChange={(e) => {
                      const newRoom = e.target.value;
                      setManualRoomId(newRoom);
                      const isG = newRoom === 'ps5-gaming';
                      const defaultSlot = isG ? '10:00 AM - 11:00 AM' : '10:00 AM - 11:30 AM';
                      setManualTimeSlot(defaultSlot);
                      const validAddOns = manualAddOns.filter(name => {
                        const item = ADD_ONS.find(a => a.name === name || a.id === name);
                        return !item?.allowedRoomId || item.allowedRoomId === newRoom;
                      });
                      setManualAddOns(validAddOns);
                      const newPrice = calculatePriceForManualBooking(newRoom, manualGuests, validAddOns, defaultSlot);
                      setManualTotalPrice(newPrice);
                    }}
                  >
                    {themesList.map(r => (
                      <option key={r.id} value={r.id} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                        {r.name} ({r.occasionLabel}) — Base ₹{r.price} ({r.duration})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Slot Grid */}
                <div style={{ marginBottom: '16px' }}>
                  <div className={styles.formGridTwo} style={{ marginBottom: manualSlotMode === 'custom' ? '12px' : '0' }}>
                    <div>
                      <label className={styles.formLabelCustom}>Booking Date *</label>
                      <input
                        type="date"
                        required
                        className={styles.formInputCustom}
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label className={styles.formLabelCustom} style={{ margin: 0 }}>Showtime Slot *</label>
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setManualSlotMode('standard');
                              const fallbackSlot = manualRoomId === 'ps5-gaming' ? '10:00 AM - 11:00 AM' : '10:00 AM - 11:30 AM';
                              const slotToUse = STANDARD_MANUAL_SLOTS.includes(manualTimeSlot) ? manualTimeSlot : fallbackSlot;
                              setManualTimeSlot(slotToUse);
                              const newPrice = calculatePriceForManualBooking(manualRoomId, manualGuests, manualAddOns, slotToUse);
                              setManualTotalPrice(newPrice);
                            }}
                            style={{
                              background: manualSlotMode === 'standard' ? 'linear-gradient(135deg, #ff0055 0%, #ff5500 100%)' : 'transparent',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            ⏱️ Predefined
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setManualSlotMode('custom');
                              try {
                                const { startMinutes, endMinutes } = parseTimeRange(manualTimeSlot);
                                const s = convertMinutesTo12Hour(startMinutes);
                                const e = convertMinutesTo12Hour(endMinutes);
                                setManualCustomStartHour(s.hour12.toString().padStart(2, '0'));
                                setManualCustomStartMin(s.minute.toString().padStart(2, '0'));
                                setManualCustomStartAmPm(s.ampm);
                                setManualCustomEndHour(e.hour12.toString().padStart(2, '0'));
                                setManualCustomEndMin(e.minute.toString().padStart(2, '0'));
                                setManualCustomEndAmPm(e.ampm);
                              } catch {}
                            }}
                            style={{
                              background: manualSlotMode === 'custom' ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' : 'transparent',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            ⚙️ Custom Timing
                          </button>
                        </div>
                      </div>

                      {manualSlotMode === 'standard' && (
                        <select
                          className={styles.formInputCustom}
                          value={manualTimeSlot}
                          onChange={(e) => {
                            const newSlot = e.target.value;
                            setManualTimeSlot(newSlot);
                            const newPrice = calculatePriceForManualBooking(manualRoomId, manualGuests, manualAddOns, newSlot);
                            setManualTotalPrice(newPrice);
                          }}
                        >
                          {(manualRoomId === 'ps5-gaming' ? [
                            '10:00 AM - 11:00 AM',
                            '11:00 AM - 12:00 PM',
                            '12:00 PM - 01:00 PM',
                            '01:00 PM - 02:00 PM',
                            '02:00 PM - 03:00 PM',
                            '03:00 PM - 04:00 PM',
                            '04:00 PM - 05:00 PM',
                            '05:00 PM - 06:00 PM',
                            '06:00 PM - 07:00 PM',
                            '07:00 PM - 08:00 PM',
                            '08:00 PM - 09:00 PM',
                            '09:00 PM - 10:00 PM',
                            '10:00 PM - 11:00 PM',
                            '11:00 PM - 12:00 AM',
                          ] : STANDARD_MANUAL_SLOTS).map(slot => (
                            <option key={slot} value={slot} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{slot}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Expanded Custom Slot Timing Configuration Box */}
                  {manualSlotMode === 'custom' && (
                    <div style={{
                      background: 'rgba(168, 85, 247, 0.07)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3e8ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⚙️ Custom Showtime Slot Builder
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                          Operating hours: 10:00 AM – 01:30 AM Late Night
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                        {/* Start Time Selector */}
                        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <span style={{ fontSize: '0.73rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                            START TIME
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              className={styles.formInputCustom}
                              style={{ padding: '8px 6px', fontSize: '0.85rem', flex: 1, minWidth: '55px' }}
                              value={manualCustomStartHour}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualCustomStartHour(val);
                                updateManualCustomSlot(val, manualCustomStartMin, manualCustomStartAmPm, manualCustomEndHour, manualCustomEndMin, manualCustomEndAmPm);
                              }}
                            >
                              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                                <option key={h} value={h} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{h}</option>
                              ))}
                            </select>
                            <span style={{ alignSelf: 'center', fontWeight: 700, color: '#94a3b8' }}>:</span>
                            <select
                              className={styles.formInputCustom}
                              style={{ padding: '8px 6px', fontSize: '0.85rem', flex: 1, minWidth: '55px' }}
                              value={manualCustomStartMin}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualCustomStartMin(val);
                                updateManualCustomSlot(manualCustomStartHour, val, manualCustomStartAmPm, manualCustomEndHour, manualCustomEndMin, manualCustomEndAmPm);
                              }}
                            >
                              {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                                <option key={m} value={m} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{m}</option>
                              ))}
                            </select>
                            <select
                              className={styles.formInputCustom}
                              style={{ padding: '8px 6px', fontSize: '0.85rem', width: '65px' }}
                              value={manualCustomStartAmPm}
                              onChange={(e) => {
                                const val = e.target.value as 'AM' | 'PM';
                                setManualCustomStartAmPm(val);
                                updateManualCustomSlot(manualCustomStartHour, manualCustomStartMin, val, manualCustomEndHour, manualCustomEndMin, manualCustomEndAmPm);
                              }}
                            >
                              <option value="AM" style={{ color: '#111827', backgroundColor: '#ffffff' }}>AM</option>
                              <option value="PM" style={{ color: '#111827', backgroundColor: '#ffffff' }}>PM</option>
                            </select>
                          </div>
                        </div>

                        {/* End Time Selector */}
                        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <span style={{ fontSize: '0.73rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                            END TIME
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select
                              className={styles.formInputCustom}
                              style={{ padding: '8px 6px', fontSize: '0.85rem', flex: 1, minWidth: '55px' }}
                              value={manualCustomEndHour}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualCustomEndHour(val);
                                updateManualCustomSlot(manualCustomStartHour, manualCustomStartMin, manualCustomStartAmPm, val, manualCustomEndMin, manualCustomEndAmPm);
                              }}
                            >
                              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                                <option key={h} value={h} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{h}</option>
                              ))}
                            </select>
                            <span style={{ alignSelf: 'center', fontWeight: 700, color: '#94a3b8' }}>:</span>
                            <select
                              className={styles.formInputCustom}
                              style={{ padding: '8px 6px', fontSize: '0.85rem', flex: 1, minWidth: '55px' }}
                              value={manualCustomEndMin}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualCustomEndMin(val);
                                updateManualCustomSlot(manualCustomStartHour, manualCustomStartMin, manualCustomStartAmPm, manualCustomEndHour, val, manualCustomEndAmPm);
                              }}
                            >
                              {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                                <option key={m} value={m} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{m}</option>
                              ))}
                            </select>
                            <select
                              className={styles.formInputCustom}
                              style={{ padding: '8px 6px', fontSize: '0.85rem', width: '65px' }}
                              value={manualCustomEndAmPm}
                              onChange={(e) => {
                                const val = e.target.value as 'AM' | 'PM';
                                setManualCustomEndAmPm(val);
                                updateManualCustomSlot(manualCustomStartHour, manualCustomStartMin, manualCustomStartAmPm, manualCustomEndHour, manualCustomEndMin, val);
                              }}
                            >
                              <option value="AM" style={{ color: '#111827', backgroundColor: '#ffffff' }}>AM</option>
                              <option value="PM" style={{ color: '#111827', backgroundColor: '#ffffff' }}>PM</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Quick Duration Buttons */}
                      <div>
                        <span style={{ fontSize: '0.73rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                          ⚡ Quick Duration Presets (Sets End Time from Start Time):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {[
                            { label: '+1 Hr', duration: 1 },
                            { label: '+1.5 Hrs (Standard)', duration: 1.5 },
                            { label: '+2 Hrs', duration: 2 },
                            { label: '+2.5 Hrs', duration: 2.5 },
                            { label: '+3 Hrs (Movie & Party)', duration: 3 },
                            { label: '+4 Hrs (Mega Bash)', duration: 4 },
                          ].map((btn) => (
                            <button
                              key={btn.label}
                              type="button"
                              onClick={() => applyManualQuickDuration(btn.duration)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#f1f5f9',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Formatted Slot & Direct Manual Text Override */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600 }}>
                            Formatted Slot String (Editable or auto-generated):
                          </span>
                          {isLateNightSlot(manualTimeSlot) && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                              🌙 Late Night Slot (+₹500 Surcharge)
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          className={styles.formInputCustom}
                          style={{
                            fontWeight: 700,
                            color: '#38bdf8',
                            fontSize: '0.95rem',
                            letterSpacing: '0.5px',
                            background: 'rgba(0, 0, 0, 0.5)',
                            borderColor: '#38bdf8',
                          }}
                          value={manualTimeSlot}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManualTimeSlot(val);
                            const newPrice = calculatePriceForManualBooking(manualRoomId, manualGuests, manualAddOns, val);
                            setManualTotalPrice(newPrice);
                          }}
                          placeholder="e.g. 02:15 PM - 03:45 PM"
                        />
                        <small style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                          This exact string will be saved and blocked in the calendar.
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add-ons Checklist */}
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabelCustom}>Select Add-ons (Optional)</label>
                  <div className={styles.addonChecklist}>
                    {ADD_ONS.filter(addon => !addon.allowedRoomId || addon.allowedRoomId === manualRoomId).map(addon => {
                      const isChecked = manualAddOns.includes(addon.name);
                      return (
                        <div
                          key={addon.id}
                          className={`${styles.addonCheckItem} ${isChecked ? styles.addonCheckItemActive : ''}`}
                          onClick={() => {
                            const updated = isChecked
                              ? manualAddOns.filter(a => a !== addon.name)
                              : [...manualAddOns, addon.name];
                            setManualAddOns(updated);
                            const newPrice = calculatePriceForManualBooking(manualRoomId, manualGuests, updated, manualTimeSlot);
                            setManualTotalPrice(newPrice);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{addon.icon} {addon.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>+₹{addon.price}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing & Advance Payment */}
                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Total Package Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      className={styles.formInputCustom}
                      value={manualTotalPrice}
                      onChange={(e) => setManualTotalPrice(Number(e.target.value))}
                    />
                    <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Auto-calculated. Staff can override for special rates.
                    </small>
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Advance Payment Collected (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={manualTotalPrice}
                      className={styles.formInputCustom}
                      value={manualAdvancePaid}
                      onChange={(e) => setManualAdvancePaid(Number(e.target.value))}
                    />
                    <small style={{ fontSize: '0.72rem', color: '#f59e0b' }}>
                      Balance Due: ₹{Math.max(0, manualTotalPrice - manualAdvancePaid)}
                    </small>
                  </div>
                </div>

                {/* Payment Method & UTR */}
                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Method</label>
                    <select
                      className={styles.formInputCustom}
                      value={manualPaymentMode}
                      onChange={(e) => setManualPaymentMode(e.target.value)}
                    >
                      <option value="Cash" style={{ color: '#111827', backgroundColor: '#ffffff' }}>💵 Cash at Venue Counter</option>
                      <option value="UPI (Counter QR)" style={{ color: '#111827', backgroundColor: '#ffffff' }}>📱 UPI Counter QR (Google Pay / PhonePe)</option>
                      <option value="Card (POS Machine)" style={{ color: '#111827', backgroundColor: '#ffffff' }}>💳 Credit / Debit Card (POS)</option>
                      <option value="Bank Transfer" style={{ color: '#111827', backgroundColor: '#ffffff' }}>🏦 Direct Bank Transfer / NEFT</option>
                      <option value="Pay at Venue Desk" style={{ color: '#111827', backgroundColor: '#ffffff' }}>⏳ Zero Advance (Pay at Desk)</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Reference / UTR (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 12-digit UTR or Cash receipt #"
                      className={styles.formInputCustom}
                      value={manualUtr}
                      onChange={(e) => setManualUtr(e.target.value)}
                    />
                  </div>
                </div>

                {/* Staff Notes */}
                <div>
                  <label className={styles.formLabelCustom}>Internal Staff Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Requested flower cake setup, customer arriving 15m early..."
                    className={styles.formTextareaCustom}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooterCustom}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsManualBookingModalOpen(false)}
                  disabled={manualSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 100%)', border: 'none' }}
                  disabled={manualSubmitting}
                >
                  {manualSubmitting ? 'Saving Booking...' : '💾 Confirm & Block Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT & PAYMENT LEDGER */}
      {selectedBookingForPayment && (
        <div className={styles.modalOverlayCustom} onClick={() => setSelectedBookingForPayment(null)}>
          <div className={`${styles.modalContentCustom} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCustom}>
              <div>
                <h3>💵 Payment Ledger & Balance Collection</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Booking ID: <span style={{ fontFamily: 'monospace', color: '#ffffff' }}>{selectedBookingForPayment.id}</span> · {selectedBookingForPayment.customerName}
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtnCustom}
                onClick={() => setSelectedBookingForPayment(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBodyCustom}>
              {/* Financial Snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL BILL</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>₹{selectedBookingForPayment.totalPrice}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#10b981' }}>TOTAL COLLECTED</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>₹{selectedBookingForPayment.advancePaid ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>OUTSTANDING BALANCE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>₹{selectedBookingForPayment.balanceDue ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#60a5fa' }}>SETTLEMENT STATUS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
                    {selectedBookingForPayment.balanceDue === 0 ? 'Fully Paid ✅' : 'Balance Due ⏳'}
                  </div>
                </div>
              </div>

              {/* Payment History Ledger */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#ffffff' }}>
                  📜 Timestamped Payment History ({selectedBookingForPayment.paymentLedger?.length || (selectedBookingForPayment.advancePaid ? 1 : 0)} entries)
                </h4>
                {selectedBookingForPayment.paymentLedger && selectedBookingForPayment.paymentLedger.length > 0 ? (
                  <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '8px 10px' }}>Date / Time</th>
                          <th style={{ padding: '8px 10px' }}>Type</th>
                          <th style={{ padding: '8px 10px' }}>Amount</th>
                          <th style={{ padding: '8px 10px' }}>Mode</th>
                          <th style={{ padding: '8px 10px' }}>UTR / Notes</th>
                          <th style={{ padding: '8px 10px' }}>Staff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBookingForPayment.paymentLedger.map((entry) => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 10px' }}>{new Date(entry.recordedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                background: entry.type === 'full' ? 'rgba(16, 185, 129, 0.2)' : entry.type === 'balance' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: entry.type === 'full' ? '#10b981' : entry.type === 'balance' ? '#60a5fa' : '#fbbf24',
                              }}>
                                {entry.type}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#10b981' }}>₹{entry.amount}</td>
                            <td style={{ padding: '8px 10px' }}>{entry.paymentMode}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                              {entry.utrNumber || entry.notes || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{entry.recordedBy || 'System'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Initial Advance: ₹{selectedBookingForPayment.advancePaid ?? 0} ({selectedBookingForPayment.paymentMode || 'UPI'})
                  </div>
                )}
              </div>

              {/* Record New Payment Form */}
              <form onSubmit={handleRecordPaymentSubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#ffffff' }}>
                  ➕ Record New Transaction
                </h4>
                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className={styles.formInputCustom}
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Mode *</label>
                    <select
                      className={styles.formInputCustom}
                      value={collectPaymentMode}
                      onChange={(e) => setCollectPaymentMode(e.target.value)}
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="UPI">📱 UPI (Google Pay / PhonePe)</option>
                      <option value="Card">💳 Credit / Debit Card</option>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Type</label>
                    <select
                      className={styles.formInputCustom}
                      value={collectType}
                      onChange={(e) => setCollectType(e.target.value as any)}
                    >
                      <option value="balance">Remaining Balance</option>
                      <option value="advance">Additional Advance</option>
                      <option value="full">Full Settlement</option>
                      <option value="refund">Refund / Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>UTR / Cheque / Ref Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 524168749321"
                      className={styles.formInputCustom}
                      value={collectUtr}
                      onChange={(e) => setCollectUtr(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className={styles.formLabelCustom}>Receipt / Staff Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in cash at reception desk..."
                    className={styles.formInputCustom}
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedBookingForPayment(null)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={collectSubmitting}
                    style={{ background: '#10b981', borderColor: '#10b981', color: '#ffffff' }}
                  >
                    {collectSubmitting ? 'Recording...' : '💾 Log Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BOOKING MODAL */}
      {isEditBookingModalOpen && editingBooking && (
        <div className={styles.modalOverlayCustom} onClick={() => setIsEditBookingModalOpen(false)}>
          <div className={`${styles.modalContentCustom} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCustom}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✏️ Edit Reservation #{editingBooking.id}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Update guest details, slot schedule, pricing breakdown, or status
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtnCustom}
                onClick={() => setIsEditBookingModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditBooking}>
              <div className={styles.modalBodyCustom}>
                {editBookingError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
                    ⚠️ {editBookingError}
                  </div>
                )}

                {/* Customer Details */}
                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabelCustom}>Customer Name *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInputCustom}
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      className={styles.formInputCustom}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwo} style={{ marginTop: '12px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Email Address</label>
                    <input
                      type="email"
                      className={styles.formInputCustom}
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Booking Source</label>
                    <select
                      className={styles.formInputCustom}
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                    >
                      <option value="Website">🌐 Website Direct</option>
                      <option value="WhatsApp">💬 WhatsApp</option>
                      <option value="Phone Call">📞 Phone Call</option>
                      <option value="Walk-in">🚶 Walk-in Desk</option>
                    </select>
                  </div>
                </div>

                {/* Suite & Schedule */}
                <div className={styles.formGridTwo} style={{ marginTop: '12px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Room / Suite</label>
                    <select
                      className={styles.formInputCustom}
                      value={editRoomId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditRoomId(val);
                        const rObj = ROOMS.find(r => r.id === val);
                        if (rObj) setEditPackageName(`${rObj.name} (${rObj.occasionLabel})`);
                      }}
                    >
                      {ROOMS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.occasionLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Package Display Name</label>
                    <input
                      type="text"
                      className={styles.formInputCustom}
                      value={editPackageName}
                      onChange={(e) => setEditPackageName(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwo} style={{ marginTop: '12px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Show Date *</label>
                    <input
                      type="date"
                      required
                      className={styles.formInputCustom}
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Time Slot *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInputCustom}
                      value={editTimeSlot}
                      onChange={(e) => setEditTimeSlot(e.target.value)}
                    />
                  </div>
                </div>

                {/* Financial Ledger & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginTop: '12px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.formInputCustom}
                      value={editGuestCount}
                      onChange={(e) => setEditGuestCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Total Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.formInputCustom}
                      value={editTotalPrice}
                      onChange={(e) => {
                        const tot = Number(e.target.value) || 0;
                        const adv = Number(editAdvancePaid) || 0;
                        setEditTotalPrice(e.target.value);
                        setEditBalanceDue(String(Math.max(0, tot - adv)));
                      }}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Advance Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.formInputCustom}
                      value={editAdvancePaid}
                      onChange={(e) => {
                        const adv = Number(e.target.value) || 0;
                        const tot = Number(editTotalPrice) || 0;
                        setEditAdvancePaid(e.target.value);
                        setEditBalanceDue(String(Math.max(0, tot - adv)));
                      }}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Balance Due (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.formInputCustom}
                      value={editBalanceDue}
                      onChange={(e) => setEditBalanceDue(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwo} style={{ marginTop: '12px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Booking Status</label>
                    <select
                      className={styles.formInputCustom}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                    >
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="pending">⏳ Pending Verification</option>
                      <option value="tentative">📝 Tentative Hold</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Status</label>
                    <select
                      className={styles.formInputCustom}
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                    >
                      <option value="fully_paid">✨ Fully Paid (₹0 Due)</option>
                      <option value="advance_paid">💵 Advance Paid (Balance Due)</option>
                      <option value="pending">⏳ Pending Payment</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGridTwo} style={{ marginTop: '12px' }}>
                  <div>
                    <label className={styles.formLabelCustom}>Payment Mode</label>
                    <input
                      type="text"
                      className={styles.formInputCustom}
                      value={editPaymentMode}
                      onChange={(e) => setEditPaymentMode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabelCustom}>UTR / Ref Number</label>
                    <input
                      type="text"
                      className={styles.formInputCustom}
                      value={editUtrNumber}
                      onChange={(e) => setEditUtrNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label className={styles.formLabelCustom}>Special Requests / Cake / Surprise Notes</label>
                  <textarea
                    rows={2}
                    className={styles.formInputCustom}
                    value={editSpecialRequests}
                    onChange={(e) => setEditSpecialRequests(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label className={styles.formLabelCustom}>Staff / Admin Internal Notes</label>
                  <input
                    type="text"
                    className={styles.formInputCustom}
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditBookingModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editBookingSubmitting}
                    style={{ background: '#3b82f6', borderColor: '#3b82f6', color: '#ffffff' }}
                  >
                    {editBookingSubmitting ? 'Saving...' : '💾 Save Booking Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation */}
      <div className={styles.mobileBottomNav}>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'bookings' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <span className={styles.mobileNavIcon}>📋</span>
          <span>Bookings</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'calendar' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span className={styles.mobileNavIcon}>📅</span>
          <span>Calendar</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'payments' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <span className={styles.mobileNavIcon}>💳</span>
          <span>Payments</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'crm' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('crm')}
        >
          <span className={styles.mobileNavIcon}>👥</span>
          <span>CRM</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'orders' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className={styles.mobileNavIcon}>🍿</span>
          <span>Orders</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'menu' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <span className={styles.mobileNavIcon}>🍔</span>
          <span>Menu</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'themes' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <span className={styles.mobileNavIcon}>🎨</span>
          <span>Themes</span>
        </button>
      </div>

      {/* AUTHORISED AI BUSINESS COPILOT DRAWER */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSwitchTab={(tab) => setActiveTab(tab as any)}
      />
    </div>
  );
}
