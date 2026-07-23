'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import type { MenuItem } from '@/lib/db';

interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  addOns: string[];
  totalPrice: number;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null represents checking state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const [archiveStatus, setArchiveStatus] = useState<{ count: number; ordersCount?: number; destination: string } | null>(null);
  
  // Food Orders and Menu States
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders' | 'qrs' | 'menu'>('bookings');
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [newlyAddedOrderIds, setNewlyAddedOrderIds] = useState<string[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [origin, setOrigin] = useState('');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // Menu Modal States
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState<'snacks' | 'beverages' | 'desserts'>('snacks');
  const [itemDescription, setItemDescription] = useState('');
  const [itemIcon, setItemIcon] = useState('🍿');

  // Web Audio Context to circumvent browser autoplay restrictions
  const audioContextRef = useRef<AudioContext | null>(null);

  // Stable refs to track IDs we have already seen — avoids false-positive sounds
  const knownBookingIdsRef = useRef<Set<string> | null>(null);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioContextRef.current = new AudioCtxClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  };

  // Bind initAudioContext to standard user gestures on the page
  useEffect(() => {
    const handleGesture = () => {
      initAudioContext();
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, []);

  // Play a beautiful arpeggio chord chime for new food orders (distinct, volume 0.25)
  const playOrderSound = () => {
    try {
      const ctx = audioContextRef.current;
      // Only play sound if context exists and is actively running to prevent audio glitches
      if (!ctx || ctx.state !== 'running') return;

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Volume envelope: smooth attack, exponential decay (prevents audio click pops)
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };

      const now = ctx.currentTime;
      playNote(523.25, now, 0.18);       // C5
      playNote(659.25, now + 0.12, 0.18);  // E5
      playNote(783.99, now + 0.24, 0.35);  // G5
    } catch (e) {
      console.warn('Could not play order notification audio:', e);
    }
  };

  // Play a distinct chime for new bookings
  const playBookingSound = () => {
    try {
      const ctx = audioContextRef.current;
      // Only play sound if context exists and is actively running to prevent audio glitches
      if (!ctx || ctx.state !== 'running') return;

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
      playNote(587.33, now, 0.12);       // D5
      playNote(698.46, now + 0.1, 0.12);  // F5
      playNote(880.00, now + 0.2, 0.25);  // A5
    } catch (e) {
      console.warn('Could not play booking notification audio:', e);
    }
  };
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Check auth and archived status on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    const savedCode = sessionStorage.getItem('bee_vibe_admin_passcode');
    if (savedCode) {
      verifyPasscode(savedCode);
    } else {
      setIsAuthenticated(false);
    }

    const savedCount = sessionStorage.getItem('bee_vibe_archived_count');
    const savedOrdersCount = sessionStorage.getItem('bee_vibe_archived_orders_count');
    const savedDest = sessionStorage.getItem('bee_vibe_archived_destination');
    if ((savedCount || savedOrdersCount) && savedDest) {
      setArchiveStatus({
        count: parseInt(savedCount || '0', 10),
        ordersCount: parseInt(savedOrdersCount || '0', 10),
        destination: savedDest
      });
    }
  }, []);

  // Polling for new bookings and orders when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchBookings(undefined, true);
      fetchOrders(undefined, true);
      fetchMenu(undefined, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const runArchiving = async (codeValue?: string) => {
    const activePasscode = codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    try {
      const res = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if ((data.count && data.count > 0) || (data.ordersCount && data.ordersCount > 0)) {
          sessionStorage.setItem('bee_vibe_archived_count', String(data.count || 0));
          sessionStorage.setItem('bee_vibe_archived_orders_count', String(data.ordersCount || 0));
          sessionStorage.setItem('bee_vibe_archived_destination', data.destination);
          setArchiveStatus({ count: data.count || 0, ordersCount: data.ordersCount || 0, destination: data.destination });
          // Fetch updated bookings and food orders lists since past ones were archived
          fetchBookings(activePasscode);
          fetchOrders(activePasscode);
        }
      }
    } catch (err) {
      console.error('Error running daily archiving task:', err);
    }
  };

  const verifyPasscode = async (codeToCheck: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: codeToCheck }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        sessionStorage.setItem('bee_vibe_admin_passcode', codeToCheck);
        setIsAuthenticated(true);
        fetchBookings(codeToCheck);
        fetchOrders(codeToCheck);
        fetchMenu(codeToCheck);
        runArchiving(codeToCheck);
      } else {
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        setIsAuthenticated(false);
        setLoginError(data.error || 'Incorrect admin passcode.');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication server.');
      setIsAuthenticated(false);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput) {
      setLoginError('Please enter the passcode.');
      return;
    }
    verifyPasscode(passcodeInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bee_vibe_admin_passcode');
    sessionStorage.removeItem('bee_vibe_archived_count');
    sessionStorage.removeItem('bee_vibe_archived_orders_count');
    sessionStorage.removeItem('bee_vibe_archived_destination');
    setIsAuthenticated(false);
    setPasscodeInput('');
    setBookings([]);
    setOrders([]);
    setMenuItems([]);
    setActiveTab('bookings');
    setArchiveStatus(null);
  };

  // Fetch all bookings with authorization header
  async function fetchBookings(codeValue?: string, isBackground = false) {
    const activePasscode = codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    
    try {
      if (!isBackground) {
        setLoading(true);
      }
      setError('');
      const res = await fetch('/api/bookings', {
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!res.ok) throw new Error('Failed to load bookings list.');
      const data = await res.json();
      const newBookings = data.bookings || [];

      if (isBackground) {
        // Initialise the known-IDs ref on the very first background poll
        if (knownBookingIdsRef.current === null) {
          knownBookingIdsRef.current = new Set(newBookings.map((b: Booking) => b.id));
          setBookings(newBookings);
          return;
        }

        const added = newBookings.filter((b: Booking) => !knownBookingIdsRef.current!.has(b.id));
        if (added.length > 0) {
          const addedIds = added.map((b: Booking) => b.id);
          added.forEach((b: Booking) => knownBookingIdsRef.current!.add(b.id));
          setNewlyAddedIds((curr) => [...curr, ...addedIds]);

          // Play a soft notification audio chime ONLY for genuinely new bookings
          playBookingSound();

          // Clear highlight animation class after 8 seconds
          setTimeout(() => {
            setNewlyAddedIds((curr) => curr.filter((id) => !addedIds.includes(id)));
          }, 8000);
        }
        setBookings(newBookings);
      } else {
        // Initial load — seed the ref so the first background poll has no false positives
        knownBookingIdsRef.current = new Set(newBookings.map((b: Booking) => b.id));
        setBookings(newBookings);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }

  // Fetch all food orders with authorization header
  async function fetchOrders(codeValue?: string, isBackground = false) {
    const activePasscode = codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    
    try {
      if (!isBackground) {
        setOrdersLoading(true);
      }
      const res = await fetch('/api/orders', {
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!res.ok) throw new Error('Failed to load food orders list.');
      const data = await res.json();
      const newOrders = data.orders || [];

      if (isBackground) {
        // Initialise the known-IDs ref on the very first background poll
        if (knownOrderIdsRef.current === null) {
          knownOrderIdsRef.current = new Set(newOrders.map((o: FoodOrder) => o.id));
          setOrders(newOrders);
          return;
        }

        const added = newOrders.filter((o: FoodOrder) => !knownOrderIdsRef.current!.has(o.id));
        if (added.length > 0) {
          const addedIds = added.map((o: FoodOrder) => o.id);
          added.forEach((o: FoodOrder) => knownOrderIdsRef.current!.add(o.id));
          setNewlyAddedOrderIds((curr) => [...curr, ...addedIds]);

          // Play order sound ONLY for genuinely new food orders
          playOrderSound();

          // Clear highlight animation class after 8 seconds
          setTimeout(() => {
            setNewlyAddedOrderIds((curr) => curr.filter((id) => !addedIds.includes(id)));
          }, 8000);
        }

        // Merge server data: preserve local status changes from the UI by only
        // updating items whose status has actually changed server-side
        setOrders((prev) => {
          const serverMap = new Map<string, FoodOrder>(newOrders.map((o: FoodOrder) => [o.id, o]));
          // Keep prev items (with their UI-updated status) and add new ones
          const merged: FoodOrder[] = prev.map((o) => serverMap.get(o.id) ?? o);
          const prevIds = new Set(prev.map((o) => o.id));
          newOrders.forEach((o: FoodOrder) => { if (!prevIds.has(o.id)) merged.push(o); });
          return merged;
        });
      } else {
        // Initial load — seed the ref
        knownOrderIdsRef.current = new Set(newOrders.map((o: FoodOrder) => o.id));
        setOrders(newOrders);
      }
    } catch (err: any) {
      console.error('Error loading food orders:', err);
    } finally {
      if (!isBackground) {
        setOrdersLoading(false);
      }
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    const activePasscode = sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        alert('Authentication expired. Please log in again.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update booking status.');
      }

      // Update state locally
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating booking.');
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: FoodOrder['status']) => {
    const activePasscode = sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        alert('Authentication expired. Please log in again.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update food order status.');
      }

      // Update state locally
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating food order.');
    }
  };

  // Fetch all menu items
  async function fetchMenu(codeValue?: string, isBackground = false) {
    const activePasscode = codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    
    try {
      if (!isBackground) {
        setMenuLoading(true);
      }
      const res = await fetch('/api/menu', {
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!res.ok) throw new Error('Failed to load menu list.');
      const data = await res.json();
      setMenuItems(data.menuItems || []);
    } catch (err: any) {
      console.error('Error fetching menu:', err);
    } finally {
      if (!isBackground) {
        setMenuLoading(false);
      }
    }
  }

  // Toggle Stock Status
  const handleToggleStock = async (item: MenuItem) => {
    const activePasscode = sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    const newStock = !item.inStock;

    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          ...item,
          inStock: newStock
        }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        alert('Authentication expired. Please log in again.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update menu item stock.');
      }

      // Update state locally
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, inStock: newStock } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating item stock.');
    }
  };

  // Delete Menu Item
  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const activePasscode = sessionStorage.getItem('bee_vibe_admin_passcode') || '';

    try {
      const res = await fetch(`/api/menu?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        alert('Authentication expired. Please log in again.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete menu item.');
      }

      // Update state locally
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting menu item.');
    }
  };

  // Add or Edit Menu Item Form Submit
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemIcon) {
      alert('Please fill in Name, Price, and Icon.');
      return;
    }

    const activePasscode = sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    const payload = {
      name: itemName,
      price: Number(itemPrice),
      description: itemDescription,
      category: itemCategory,
      icon: itemIcon,
      ...(editingMenuItem ? { id: editingMenuItem.id, inStock: editingMenuItem.inStock } : {})
    };

    try {
      const url = '/api/menu';
      const method = editingMenuItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('bee_vibe_admin_passcode');
        alert('Authentication expired. Please log in again.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save menu item.');
      }

      const data = await res.json();
      
      // Update local state
      if (editingMenuItem) {
        setMenuItems((prev) =>
          prev.map((m) => (m.id === editingMenuItem.id ? data.menuItem : m))
        );
      } else {
        setMenuItems((prev) => [...prev, data.menuItem]);
      }

      // Reset modal and inputs
      setIsMenuModalOpen(false);
      setEditingMenuItem(null);
      setItemName('');
      setItemPrice('');
      setItemCategory('snacks');
      setItemDescription('');
      setItemIcon('🍿');
    } catch (err: any) {
      alert(err.message || 'Error saving menu item.');
    }
  };



  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDate = dateFilter ? b.date === dateFilter : true;
    
    return matchesSearch && matchesDate;
  });

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone && o.phone.includes(searchTerm));
      
    const matchesStatus = orderStatusFilter === 'all' ? true : o.status === orderStatusFilter;

    const orderDate = o.createdAt ? o.createdAt.slice(0, 10) : '';
    const matchesDate = orderDateFilter ? orderDate === orderDateFilter : true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Metric calculations
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled').length;
  
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

  // Food Order metrics
  const activeOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length;
  const servedOrdersCount = orders.filter((o) => o.status === 'served').length;
  const foodRevenue = orders
    .filter((o) => o.status === 'served')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // Helper to trigger print window of theme standee card
  const handlePrintStandee = (themeColor: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const themeTitle = themeColor === 'pink' ? 'Rose Pink Theme' : themeColor === 'purple' ? 'Neon Purple Theme' : 'Crimson Red Theme';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(origin + '/menu?theme=' + themeColor)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Standee - ${themeTitle}</title>
          <style>
            body {
              background-color: #ffffff;
              color: #000000;
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .standee-card {
              border: 4px solid ${themeColor === 'pink' ? '#ff2e7e' : themeColor === 'purple' ? '#9333ea' : '#ef4848'};
              border-radius: 24px;
              padding: 40px;
              width: 380px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            .logo {
              font-size: 2.2rem;
              margin-bottom: 5px;
            }
            .brand {
              font-size: 1.8rem;
              font-weight: 800;
              margin-bottom: 20px;
              letter-spacing: 1px;
            }
            .room-title {
              background-color: ${themeColor === 'pink' ? 'rgba(255, 46, 126, 0.1)' : themeColor === 'purple' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
              color: ${themeColor === 'pink' ? '#ff2e7e' : themeColor === 'purple' ? '#9333ea' : '#ef4848'};
              font-size: 1.1rem;
              font-weight: 700;
              padding: 8px 16px;
              border-radius: 30px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .qr-code {
              width: 200px;
              height: 200px;
              margin: 0 auto 24px;
            }
            .instruction {
              font-size: 1.1rem;
              font-weight: 700;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sub-instruction {
              color: #666;
              font-size: 0.85rem;
              line-height: 1.4;
            }
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
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 1. Initial State: Checking session storage
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

  // 2. Lock screen state: Prompts for passcode
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

  // 3. Authenticated state: Show dashboard
  return (
    <div className={styles.adminContainer}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.title}>Bee Vibe Admin Panel</h1>
          <p className={styles.subtitle}>Manage customer celebrations, view analytics, and track room service</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" className="btn btn-secondary">
            View Homepage
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#f87171' }}>
            Sign Out
          </button>
        </div>
      </div>

      {archiveStatus && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '6px',
          color: '#34d399',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span>
            🧹 <strong>Daily Refresh Completed:</strong> Archived <strong>{archiveStatus.count}</strong> past booking(s) {archiveStatus.ordersCount ? <>and <strong>{archiveStatus.ordersCount}</strong> past food order(s)</> : ''} to <strong>{archiveStatus.destination === 'supabase_db' ? 'Supabase Cloud DB' : archiveStatus.destination === 'cloud_webhook' ? 'Cloud Webhook' : 'Local Archive File'}</strong>.
          </span>
          <button 
            onClick={() => {
              setArchiveStatus(null);
              sessionStorage.removeItem('bee_vibe_archived_count');
              sessionStorage.removeItem('bee_vibe_archived_orders_count');
              sessionStorage.removeItem('bee_vibe_archived_destination');
            }}
            style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && <div className={styles.loginError} style={{ margin: '0 0 24px 0', padding: '14px', fontSize: '0.9rem' }}>{error}</div>}

      {/* Tabs navigation */}
      <div className={styles.tabContainerCustom}>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'bookings' ? styles.activeTabCustom : ''}`}
          onClick={() => {
            setActiveTab('bookings');
            setSearchTerm('');
            setDateFilter('');
          }}
        >
          📅 Room Bookings ({activeBookings})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'orders' ? styles.activeTabCustom : ''}`}
          onClick={() => {
            setActiveTab('orders');
            setSearchTerm('');
            setOrderStatusFilter('all');
            setOrderDateFilter('');
          }}
        >
          🍿 Food Orders ({activeOrdersCount})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'menu' ? styles.activeTabCustom : ''}`}
          onClick={() => {
            setActiveTab('menu');
            setSearchTerm('');
          }}
        >
          🍔 Manage Menu ({menuItems.length})
        </button>
        <button
          className={`${styles.tabBtnCustom} ${activeTab === 'qrs' ? styles.activeTabCustom : ''}`}
          onClick={() => {
            setActiveTab('qrs');
          }}
        >
          🖨️ Printable QR Standees
        </button>
      </div>

      {/* Dynamic Analytics Cards */}
      {activeTab === 'bookings' && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Active Reservations</div>
            <div className={styles.metricValue}>{activeBookings} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {totalBookings} total</span></div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Confirmed Revenue</div>
            <div className={styles.metricValue}>₹{totalRevenue}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Pending Approvals</div>
            <div className={styles.metricValue} style={{ color: pendingBookings > 0 ? '#f2a900' : 'var(--text-secondary)' }}>
              {pendingBookings}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Active Orders</div>
            <div className={styles.metricValue} style={{ color: activeOrdersCount > 0 ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {activeOrdersCount}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Completed Deliveries</div>
            <div className={styles.metricValue}>{servedOrdersCount}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Food Sales Revenue</div>
            <div className={styles.metricValue} style={{ color: '#10b981' }}>
              ₹{foodRevenue}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Total Menu Items</div>
            <div className={styles.metricValue}>{menuItems.length} Items</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Active (In Stock)</div>
            <div className={styles.metricValue} style={{ color: '#10b981' }}>
              {menuItems.filter(m => m.inStock).length} Available
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Sold Out (Out of Stock)</div>
            <div className={styles.metricValue} style={{ color: '#ef4444' }}>
              {menuItems.filter(m => !m.inStock).length} Sold Out
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qrs' && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Active Rooms</div>
            <div className={styles.metricValue}>3 Themes</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Menu URL Target</div>
            <div className={styles.metricValue} style={{ fontSize: '1.1rem', wordBreak: 'break-all' }}>
              /menu?theme=[color]
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricTitle}>Standee Format</div>
            <div className={styles.metricValue} style={{ color: 'var(--accent)' }}>
              Tabletop Tent Card
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Filter and Search Bar */}
      {activeTab !== 'qrs' && activeTab !== 'menu' && (
        <div className={styles.filterBar}>
          <input
            type="text"
            placeholder={activeTab === 'bookings' ? "Search by Name, Booking ID, Phone..." : "Search by Customer Name, Order ID, Phone..."}
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {activeTab === 'bookings' ? (
            <input
              type="date"
              className={styles.dateFilter}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="date"
                className={styles.dateFilter}
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value)}
                title="Filter food orders by date"
              />
              <select
                className={styles.dateFilter}
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{ paddingRight: '20px' }}
              >
                <option value="all">🍛 All Statuses</option>
                <option value="pending">🕒 Pending Orders</option>
                <option value="preparing">🍳 Preparing Orders</option>
                <option value="served">✅ Served Orders</option>
                <option value="cancelled">❌ Cancelled Orders</option>
              </select>
            </div>
          )}
          
          {(searchTerm || dateFilter || orderDateFilter || (activeTab === 'orders' && orderStatusFilter !== 'all')) && (
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setOrderDateFilter('');
                setOrderStatusFilter('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar for Menu */}
      {activeTab === 'menu' && (
        <div className={styles.filterBar} style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <input
              type="text"
              placeholder="Search food by name..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingMenuItem(null);
              setItemName('');
              setItemPrice('');
              setItemCategory('snacks');
              setItemDescription('');
              setItemIcon('🍿');
              setIsMenuModalOpen(true);
            }}
            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
          >
            ➕ Add Food Item
          </button>
        </div>
      )}

      {/* DATA VIEW AREAS */}
      
      {/* Bookings View */}
      {activeTab === 'bookings' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className={styles.loadingSpinner} />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
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
                    filteredBookings.map((b) => {
                      const isNew = newlyAddedIds.includes(b.id);
                      return (
                        <tr key={b.id} className={isNew ? styles.newRowHighlight : ''}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{b.id}</td>
                        <td>
                          <div className={styles.customerName}>{b.customerName}</div>
                          <div className={styles.customerContact}>
                            📱 {b.phone} <br />
                            📧 {b.email} <br />
                            👥 {b.guestCount} Guests
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.date}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.timeSlot}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{b.packageName}</div>
                          {b.addOns.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Add-ons: {b.addOns.join(', ')}
                            </div>
                          )}
                          {b.specialRequests && (
                            <div style={{ fontSize: '0.75rem', color: '#ffb71a', fontStyle: 'italic', marginTop: '4px' }}>
                              💬 Note: {b.specialRequests}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{b.totalPrice}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            b.status === 'confirmed' ? styles.badgeConfirmed : b.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending
                          }`}>{b.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.actionCell}>
                              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => handleUpdateStatus(b.id, 'confirmed')} disabled={b.status === 'confirmed'}>Confirm</button>
                              <button className={`${styles.actionBtn} ${styles.actionBtnCancel}`} onClick={() => handleUpdateStatus(b.id, 'cancelled')} disabled={b.status === 'cancelled'}>Cancel</button>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className={styles.manualBtn} onClick={() => { const phone = b.phone.startsWith('+') ? b.phone : '+91' + b.phone; const text = `Hello ${b.customerName}, your booking at Bee Vibe is confirmed!\n\nTicket Code: ${b.id}\nDate: ${b.date}\nTime: ${b.timeSlot}\nTotal: ₹${b.totalPrice}\n\nPresent this code at the entrance. Thank you!`; window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank'); }} title="Send confirmation via WhatsApp manually">💬 WA</button>
                              <button className={styles.manualBtn} onClick={() => { const text = `Hello ${b.customerName}, your booking at Bee Vibe is confirmed!\n\nTicket Code: ${b.id}\nDate: ${b.date}\nTime: ${b.timeSlot}\nTotal: ₹${b.totalPrice}\n\nPresent this code at the entrance. Thank you!`; window.open(`sms:${b.phone}${navigator.userAgent.match(/iPhone|iPad|iPod/i) ? '&' : '?'}body=${encodeURIComponent(text)}`, '_blank'); }} title="Send confirmation via SMS manually">📱 SMS</button>
                              <button className={styles.manualBtn} onClick={() => { const text = `Hello ${b.customerName}, your booking at Bee Vibe is confirmed!\n\nTicket Code: ${b.id}\nDate: ${b.date}\nTime: ${b.timeSlot}\nTotal: ₹${b.totalPrice}\n\nPresent this code at the entrance. Thank you!`; navigator.clipboard.writeText(text); alert('Message copied to clipboard!'); }} title="Copy ticket text to clipboard">📋 Copy</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className={styles.noBookings}>No bookings found matching your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileCard}>
              {filteredBookings.length > 0 ? filteredBookings.map((b) => {
                const isNew = newlyAddedIds.includes(b.id);
                return (
                  <div key={b.id} className={`${styles.mobileCardItem} ${isNew ? styles.newRowHighlight : ''}`}>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Booking ID</span>
                      <span className={styles.mobileCardValue} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{b.id}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Customer</span>
                      <span className={styles.mobileCardValue}>
                        <strong>{b.customerName}</strong><br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📱 {b.phone} · 👥 {b.guestCount}</span>
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Date & Time</span>
                      <span className={styles.mobileCardValue}>{b.date}<br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.timeSlot}</span></span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Package</span>
                      <span className={styles.mobileCardValue}>{b.packageName}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Total</span>
                      <span className={styles.mobileCardValue} style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{b.totalPrice}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Status</span>
                      <span className={`${styles.badge} ${b.status === 'confirmed' ? styles.badgeConfirmed : b.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending}`}>{b.status}</span>
                    </div>
                    <div className={styles.mobileCardActions}>
                      <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => handleUpdateStatus(b.id, 'confirmed')} disabled={b.status === 'confirmed'}>✓ Confirm</button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnCancel}`} onClick={() => handleUpdateStatus(b.id, 'cancelled')} disabled={b.status === 'cancelled'}>✗ Cancel</button>
                      <button className={styles.manualBtn} style={{ flex: 1 }} onClick={() => { const phone = b.phone.startsWith('+') ? b.phone : '+91' + b.phone; const text = `Hello ${b.customerName}, your booking at Bee Vibe is confirmed!\n\nTicket Code: ${b.id}\nDate: ${b.date}\nTime: ${b.timeSlot}\nTotal: ₹${b.totalPrice}\n\nPresent this code at the entrance. Thank you!`; window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank'); }}>💬 WhatsApp</button>
                    </div>
                  </div>
                );
              }) : (
                <div className={styles.noBookings}>No bookings found matching your search.</div>
              )}
            </div>
          </>
        )
      )}

      {/* Food Orders View */}
      {activeTab === 'orders' && (
        ordersLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className={styles.loadingSpinner} />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Room (Theme)</th>
                    <th>Customer Info</th>
                    <th>Items Ordered</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const isNew = newlyAddedOrderIds.includes(order.id);
                      return (
                        <tr key={order.id} className={isNew ? styles.newRowHighlight : ''}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{order.id}</td>
                          <td>
                            <span className={`${styles.roomThemeBadge} ${
                              order.theme === 'pink' ? styles.roomThemePink : order.theme === 'purple' ? styles.roomThemePurple : styles.roomThemeRed
                            }`}>
                              {order.themeLabel}
                            </span>
                          </td>
                          <td>
                            <div className={styles.customerName}>{order.customerName || 'Guest'}</div>
                            {order.phone && (
                              <div className={styles.customerContact}>📱 {order.phone}</div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              🕒 {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.85rem' }}>
                              {order.items.map((it, idx) => (
                                <li key={idx} style={{ color: '#fff', marginBottom: '2px' }}>
                                  <strong>{it.name}</strong> <span style={{ color: 'var(--accent)' }}>x{it.quantity}</span> (₹{it.price * it.quantity})
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{order.totalPrice}</td>
                          <td>
                            <span className={`${styles.badge} ${
                              order.status === 'served' ? styles.badgeConfirmed : order.status === 'preparing' ? styles.badgePreparing : order.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending
                            }`}>{order.status}</span>
                          </td>
                          <td>
                            <div className={styles.actionCell}>
                              {order.status === 'pending' && (<button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>Accept & Cook</button>)}
                              {order.status === 'preparing' && (<button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: '#10b981' }} onClick={() => handleUpdateOrderStatus(order.id, 'served')}>Deliver Order</button>)}
                              {(order.status === 'pending' || order.status === 'preparing') && (<button className={`${styles.actionBtn} ${styles.actionBtnCancel}`} onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>Cancel</button>)}
                              {(order.status === 'served' || order.status === 'cancelled') && (<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Actions</span>)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className={styles.noBookings}>No food orders found matching your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileCard}>
              {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                const isNew = newlyAddedOrderIds.includes(order.id);
                return (
                  <div key={order.id} className={`${styles.mobileCardItem} ${isNew ? styles.newRowHighlight : ''}`}>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Order ID</span>
                      <span className={styles.mobileCardValue} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{order.id}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Room</span>
                      <span className={`${styles.roomThemeBadge} ${order.theme === 'pink' ? styles.roomThemePink : order.theme === 'purple' ? styles.roomThemePurple : styles.roomThemeRed}`}>{order.themeLabel}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Customer</span>
                      <span className={styles.mobileCardValue}>
                        {order.customerName || 'Guest'}{order.phone && <><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📱 {order.phone}</span></>}
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Items</span>
                      <span className={styles.mobileCardValue} style={{ textAlign: 'right' }}>
                        {order.items.map((it, idx) => (<span key={idx} style={{ display: 'block', fontSize: '0.83rem' }}>{it.name} <span style={{ color: 'var(--accent)' }}>×{it.quantity}</span></span>))}
                      </span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Total</span>
                      <span className={styles.mobileCardValue} style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{order.totalPrice}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Status</span>
                      <span className={`${styles.badge} ${order.status === 'served' ? styles.badgeConfirmed : order.status === 'preparing' ? styles.badgePreparing : order.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending}`}>{order.status}</span>
                    </div>
                    <div className={styles.mobileCardActions}>
                      {order.status === 'pending' && (<button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>🍳 Accept & Cook</button>)}
                      {order.status === 'preparing' && (<button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: '#10b981' }} onClick={() => handleUpdateOrderStatus(order.id, 'served')}>🚀 Deliver</button>)}
                      {(order.status === 'pending' || order.status === 'preparing') && (<button className={`${styles.actionBtn} ${styles.actionBtnCancel}`} onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>✗ Cancel</button>)}
                      {(order.status === 'served' || order.status === 'cancelled') && (<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</span>)}
                    </div>
                  </div>
                );
              }) : (
                <div className={styles.noBookings}>No food orders found matching your search.</div>
              )}
            </div>
          </>
        )
      )}

      {/* Menu Management View */}
      {activeTab === 'menu' && (
        menuLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className={styles.loadingSpinner} />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Food Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                    menuItems
                      .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontSize: '1.5rem' }}>{item.icon}</td>
                          <td>
                            <div className={styles.customerName}>{item.name}</div>
                            {item.description && (<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.description}</div>)}
                          </td>
                          <td><span style={{ textTransform: 'capitalize', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>{item.category}</span></td>
                          <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{item.price}</td>
                          <td>
                            <button onClick={() => handleToggleStock(item)} className={`${styles.actionBtn}`} style={{ background: item.inStock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: item.inStock ? '#10b981' : '#f87171', borderColor: item.inStock ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)', borderWidth: '1px', borderStyle: 'solid', width: '130px' }}>
                              {item.inStock ? '🟢 In Stock' : '🔴 Out of Stock'}
                            </button>
                          </td>
                          <td>
                            <div className={styles.actionCell}>
                              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => { setEditingMenuItem(item); setItemName(item.name); setItemPrice(String(item.price)); setItemCategory(item.category); setItemDescription(item.description); setItemIcon(item.icon); setIsMenuModalOpen(true); }}>Edit</button>
                              <button className={`${styles.actionBtn} ${styles.actionBtnCancel}`} onClick={() => handleDeleteMenuItem(item.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr><td colSpan={6} className={styles.noBookings}>No food items found matching your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileCard}>
              {menuItems.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                menuItems.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                  <div key={item.id} className={styles.mobileCardItem}>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Item</span>
                      <span className={styles.mobileCardValue}>
                        <span style={{ fontSize: '1.4rem', marginRight: '6px' }}>{item.icon}</span>
                        <strong>{item.name}</strong>
                      </span>
                    </div>
                    {item.description && (
                      <div className={styles.mobileCardRow}>
                        <span className={styles.mobileCardLabel}>Desc</span>
                        <span className={styles.mobileCardValue} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</span>
                      </div>
                    )}
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Category</span>
                      <span className={styles.mobileCardValue} style={{ textTransform: 'capitalize', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.category}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Price</span>
                      <span className={styles.mobileCardValue} style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{item.price}</span>
                    </div>
                    <div className={styles.mobileCardActions}>
                      <button onClick={() => handleToggleStock(item)} className={styles.actionBtn} style={{ flex: 1, background: item.inStock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: item.inStock ? '#10b981' : '#f87171', borderColor: item.inStock ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)', borderWidth: '1px', borderStyle: 'solid' }}>
                        {item.inStock ? '🟢 In Stock' : '🔴 Out of Stock'}
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => { setEditingMenuItem(item); setItemName(item.name); setItemPrice(String(item.price)); setItemCategory(item.category); setItemDescription(item.description); setItemIcon(item.icon); setIsMenuModalOpen(true); }}>✏️ Edit</button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnCancel}`} onClick={() => handleDeleteMenuItem(item.id)}>🗑️ Del</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noBookings}>No food items found matching your search.</div>
              )}
            </div>
          </>
        )
      )}

      {/* QR Codes View */}
      {activeTab === 'qrs' && (
        <div className={styles.qrGridContainer}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
            Print these tabletop standees and place them physically in the respective rooms. Customers can scan them to view the food menu and order directly to their recliners.
          </p>

          <div className={styles.qrStandeesList}>
            {(['pink', 'purple', 'red'] as const).map((color) => {
              const themeName = color === 'pink' ? 'Rose Pink Theme' : color === 'purple' ? 'Neon Purple Theme' : 'Crimson Red Theme';
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(origin + '/menu?theme=' + color)}`;
              
              return (
                <div key={color} className={`${styles.qrCard} ${
                  color === 'pink' ? styles.qrCardPink : color === 'purple' ? styles.qrCardPurple : styles.qrCardRed
                }`}>
                  <div className={styles.qrCardHeader}>
                    <h3>{themeName} Room</h3>
                    <span className={styles.qrCardIcon}>🍿</span>
                  </div>
                  <div className={styles.qrCardBody}>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px', border: '1px solid rgba(0,0,0,0.1)' }}>
                      <img src={qrCodeUrl} alt={`${themeName} QR Code`} style={{ width: '150px', height: '150px', display: 'block' }} />
                    </div>
                    <div className={styles.qrCardUrl}>
                      <code>/menu?theme={color}</code>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                      Scan to order snacks directly to recliners. Automatically registers room source!
                    </p>
                  </div>
                  <div className={styles.qrCardFooter}>
                    <button 
                      onClick={() => handlePrintStandee(color)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '10px 0', fontSize: '0.85rem' }}
                    >
                      🖨️ Print Desktop Standee
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu Item Form Editor Modal */}
      {isMenuModalOpen && (
        <div className={styles.modalOverlayCustom} onClick={() => setIsMenuModalOpen(false)}>
          <div className={styles.modalContentCustom} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderCustom}>
              <h3>{editingMenuItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}</h3>
              <button 
                className={styles.closeBtnCustom} 
                onClick={() => {
                  setIsMenuModalOpen(false);
                  setEditingMenuItem(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveMenuItem}>
              <div className={styles.modalBodyCustom}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '80px' }}>
                    <label className={styles.formLabelCustom}>Icon Emoji</label>
                    <input
                      type="text"
                      className={styles.formInputCustom}
                      value={itemIcon}
                      onChange={(e) => setItemIcon(e.target.value)}
                      placeholder="🍿"
                      style={{ fontSize: '1.25rem', textAlign: 'center' }}
                      required
                    />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <label className={styles.formLabelCustom}>Food Item Name</label>
                    <input
                      type="text"
                      className={styles.formInputCustom}
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. Garlic Bread"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className={styles.formLabelCustom}>Price (₹)</label>
                    <input
                      type="number"
                      className={styles.formInputCustom}
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="120"
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={styles.formLabelCustom}>Category</label>
                    <select
                      className={styles.formInputCustom}
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as any)}
                      style={{ height: '46px', textTransform: 'capitalize' }}
                      required
                    >
                      <option value="snacks">🍿 Snacks</option>
                      <option value="beverages">🥤 Beverages</option>
                      <option value="desserts">🍨 Desserts</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label className={styles.formLabelCustom}>Description (Optional)</label>
                  <textarea
                    className={styles.formTextareaCustom}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Delicious buttery garlic bread toasted to perfection."
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.modalFooterCustom}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsMenuModalOpen(false);
                    setEditingMenuItem(null);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  {editingMenuItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
