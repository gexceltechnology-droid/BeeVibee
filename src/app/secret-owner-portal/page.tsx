'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import type { MenuItem } from '@/lib/db';
import { CrmEngine, AggregatedCustomerProfile } from '@/lib/saas/crmEngine';
import { CAMPAIGN_TEMPLATES, MarketingEngine } from '@/lib/saas/marketingEngine';

interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  bookingType?: 'gaming' | 'theater';
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
  status: 'pending' | 'confirmed' | 'cancelled';
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'payments' | 'crm' | 'orders' | 'qrs' | 'menu'>('bookings');
  
  // Filter States
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState<'all' | 'theater' | 'gaming'>('all');
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
  }, [fetchBookings, fetchOrders, fetchMenu]);

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


  // Polling for live bookings, payments and orders
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
    return matchesCategory && matchesSearch && matchesDate;
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

      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.title}>Bee Vibe Management Portal</h1>
          <p className={styles.subtitle}>Unified Multi-Tenant Engine · Payment Reconciliation · Guest CRM & Loyalty Hub</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={playBookingSound}
            className="btn btn-secondary"
            style={{ borderColor: '#f2a900', color: '#f2a900', fontSize: '0.85rem', padding: '8px 14px' }}
            title="Test sound alerts"
          >
            🔔 Sound Test
          </button>
          <Link href="/" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
            View Website
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#f87171', fontSize: '0.85rem', padding: '8px 14px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className={styles.loginError} style={{ margin: '0 0 24px 0', padding: '14px', fontSize: '0.9rem' }}>{error}</div>}

      {/* TABS NAVIGATION */}
      <div className={styles.tabContainerCustom}>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'bookings' ? styles.activeTabCustom : ''}`}
          onClick={() => { setActiveTab('bookings'); setSearchTerm(''); setDateFilter(''); }}
        >
          📅 Bookings ({activeBookings})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'payments' ? styles.activeTabCustom : ''}`}
          onClick={() => { setActiveTab('payments'); setSearchTerm(''); setPaymentFilter('all'); }}
        >
          💳 Payment Portal
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'crm' ? styles.activeTabCustom : ''}`}
          onClick={() => { setActiveTab('crm'); setSearchTerm(''); setCrmTierFilter('all'); }}
        >
          👥 CRM & Guest Hub ({uniqueCustomersCount})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'orders' ? styles.activeTabCustom : ''}`}
          onClick={() => { setActiveTab('orders'); setSearchTerm(''); setOrderStatusFilter('all'); }}
        >
          🍿 Food Orders ({activeOrdersCount})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'menu' ? styles.activeTabCustom : ''}`}
          onClick={() => { setActiveTab('menu'); setSearchTerm(''); setMenuCategoryFilter('all'); }}
        >
          🍔 Menu ({menuItems.length})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'qrs' ? styles.activeTabCustom : ''}`}
          onClick={() => setActiveTab('qrs')}
        >
          🖨️ Standees
        </button>
      </div>

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
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="Search by Name, Booking ID, Phone..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className={styles.dateFilter}
                value={bookingCategoryFilter}
                onChange={(e) => setBookingCategoryFilter(e.target.value as 'all' | 'theater' | 'gaming')}
              >
                <option value="all">📋 All Categories ({activeBookings})</option>
                <option value="theater">🎬 Celebration Theater</option>
                <option value="gaming">🎮 PS5 Gaming Lounge</option>
              </select>
              <input
                type="date"
                className={styles.dateFilter}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            {(searchTerm || dateFilter || bookingCategoryFilter !== 'all') && (
              <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => { setSearchTerm(''); setDateFilter(''); setBookingCategoryFilter('all'); }}>Clear</button>
            )}
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Booking ID</th>
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
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.id}</td>
                      <td>
                        <div className={styles.customerName}>{b.customerName}</div>
                        <div className={styles.customerContact}>📱 {b.phone} <br />👥 {b.guestCount} Guests</div>
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
                            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                              ✓ Delivered
                            </span>
                          )}
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
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Show Schedule</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>📅 {selectedBookingForInvoice.date}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>⏰ {selectedBookingForInvoice.timeSlot}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>👥 {selectedBookingForInvoice.guestCount} Guests</div>
                </div>
              </div>

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
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Standard 2-Hour Private Theater Screening</div>
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
                    <td style={{ padding: '6px 12px' }}>Advance Paid (UPI)</td>
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

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                Thank you for celebrating with Bee Vibe Cinema! For inquiries call +91 81236 35342.
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

      {/* Fixed Mobile Bottom Navigation */}
      <div className={styles.mobileBottomNav}>
        <button
          type="button"
          className={`${styles.mobileNavItem} ${activeTab === 'bookings' ? styles.mobileNavItemActive : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <span className={styles.mobileNavIcon}>📅</span>
          <span>Bookings</span>
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
      </div>
    </div>
  );
}
