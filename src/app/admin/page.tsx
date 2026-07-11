'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

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

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null represents checking state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Check auth on load
  useEffect(() => {
    const savedCode = sessionStorage.getItem('bee_vibe_admin_passcode');
    if (savedCode) {
      verifyPasscode(savedCode);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

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
    setIsAuthenticated(false);
    setPasscodeInput('');
    setBookings([]);
  };

  // Fetch all bookings with authorization header
  async function fetchBookings(codeValue?: string) {
    const activePasscode = codeValue || sessionStorage.getItem('bee_vibe_admin_passcode') || '';
    
    try {
      setLoading(true);
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
      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
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

  // Metric calculations
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled').length;
  
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

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
          <p className={styles.subtitle}>Manage customer celebrations and view business analytics</p>
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

      {error && <div className={styles.loginError} style={{ margin: '0 0 24px 0', padding: '14px', fontSize: '0.9rem' }}>{error}</div>}

      {/* Analytics Cards */}
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

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by Name, Booking ID, Phone..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <input
          type="date"
          className={styles.dateFilter}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        
        {(searchTerm || dateFilter) && (
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className={styles.loadingSpinner} />
        </div>
      ) : (
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
                  <tr key={b.id}>
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
                      <span
                        className={`${styles.badge} ${
                          b.status === 'confirmed'
                            ? styles.badgeConfirmed
                            : b.status === 'cancelled'
                            ? styles.badgeCancelled
                            : styles.badgePending
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnConfirm}`}
                          onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                          disabled={b.status === 'confirmed'}
                        >
                          Confirm
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnCancel}`}
                          onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                          disabled={b.status === 'cancelled'}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={styles.noBookings}>
                    No bookings found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
