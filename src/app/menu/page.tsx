'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Coffee, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Info
} from 'lucide-react';
import styles from './menu.module.css';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'snacks' | 'beverages' | 'desserts';
  inStock: boolean;
  icon: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

const THEME_LABELS: Record<string, string> = {
  pink: 'Rose Pink Room',
  purple: 'Neon Purple Room',
  red: 'Crimson Red Room',
};

function MenuContent() {
  const searchParams = useSearchParams();
  const theme = (searchParams.get('theme') || 'pink').toLowerCase();
  const activeThemeLabel = THEME_LABELS[theme] || 'Rose Pink Room';

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'snacks' | 'beverages' | 'desserts'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Checkout Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch menu dynamically from database
  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data.menuItems || []);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
      } finally {
        setMenuLoading(false);
      }
    }
    loadMenu();
  }, []);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.inStock) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter((c) => c.item.id !== itemId);
    });
  };

  const getQuantityInCart = (itemId: string) => {
    const item = cart.find((c) => c.item.id === itemId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          themeLabel: activeThemeLabel,
          customerName: name,
          phone,
          items: cart.map(c => ({
            id: c.item.id,
            name: c.item.name,
            price: c.item.price,
            quantity: c.quantity
          })),
          totalPrice: cartTotal
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to place order.');
      }

      const data = await res.json();
      setOrderSuccess(data.order);
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter((item) => item.category === activeCategory);

  return (
    <div className={styles.container} data-vibe={theme}>
      {/* Background ambient lighting matching theme */}
      <div className="ambient-glow-bg" />
      <div className="gradient-overlay" />

      {/* Header Banner */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={16} /> Home
          </Link>
          <div className={styles.logoWrapper}>
            <span className={styles.logoIcon}>🍿</span>
            <div>
              <h1 className={styles.logoText}>Bee Vibe Cafe</h1>
              <p className={styles.logoSub}>Luxury Room Service Menu</p>
            </div>
          </div>
        </div>
        <div className={styles.roomIndicator}>
          <span className={styles.glowDot} />
          {activeThemeLabel}
        </div>
      </header>

      {/* Main content grid */}
      <main className={styles.main}>
        {/* Intro Banner Card */}
        <section className={styles.introCard}>
          <div className={styles.introContent}>
            <h2>Order Fresh Food & Drinks</h2>
            <p>Your snacks will be freshly prepared and served directly to your theater recliner screen area. Enjoy your private showing!</p>
          </div>
          <div className={styles.sparkleIcon}>
            <Sparkles size={24} />
          </div>
        </section>

        {/* Category Tab Selector */}
        <div className={styles.categoryTabs}>
          {(['all', 'snacks', 'beverages', 'desserts'] as const).map((cat) => (
            <button
              key={cat}
              className={`${styles.tabBtn} ${activeCategory === cat ? styles.activeTab : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' && '✨ All Items'}
              {cat === 'snacks' && '🍿 Snacks & Fast Foods'}
              {cat === 'beverages' && '🥤 Mocktails & Brews'}
              {cat === 'desserts' && '🍨 Desserts & Gelatos'}
            </button>
          ))}
        </div>

        {/* Items Listing Grid */}
        {menuLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div className={styles.menuGrid}>
            {filteredItems.map((item) => {
              const quantity = getQuantityInCart(item.id);
              return (
                <div key={item.id} className={`${styles.menuCard} ${!item.inStock ? styles.outOfStockCard : ''}`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.itemIcon}>{item.icon}</span>
                    {item.inStock ? (
                      <span className={styles.priceTag}>₹{item.price}</span>
                    ) : (
                      <span className={styles.outOfStockBadge}>Sold Out</span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemDesc}>{item.description}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    {!item.inStock ? (
                      <button className={styles.outOfStockBtn} disabled>
                        Out of Stock
                      </button>
                    ) : quantity > 0 ? (
                      <div className={styles.quantityControls}>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className={styles.qtyBtn}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qtyCount}>{quantity}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className={styles.qtyBtn}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)}
                        className={styles.addBtn}
                      >
                        <Plus size={14} style={{ marginRight: '6px' }} /> Add to Screen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Sticky Cart Bar */}
      {cartItemCount > 0 && (
        <div className={styles.cartBar}>
          <div className={styles.cartBarInner}>
            <div className={styles.cartInfo}>
              <div className={styles.cartIconWrapper}>
                <ShoppingBag size={20} />
                <span className={styles.cartBadge}>{cartItemCount}</span>
              </div>
              <div>
                <div className={styles.cartTotalText}>₹{cartTotal}</div>
                <div className={styles.cartSubText}>Order from {activeThemeLabel}</div>
              </div>
            </div>
            <button 
              className={styles.checkoutBtn}
              onClick={() => setIsCartOpen(true)}
            >
              View Order Cart
            </button>
          </div>
        </div>
      )}

      {/* Cart Summary Drawer Modal */}
      {isCartOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCartOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🛒 Order Cart Summary</h3>
              <button className={styles.closeBtn} onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {cart.map((c) => (
                <div key={c.item.id} className={styles.cartRow}>
                  <div className={styles.cartRowInfo}>
                    <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{c.item.icon}</span>
                    <div>
                      <div className={styles.cartRowName}>{c.item.name}</div>
                      <div className={styles.cartRowPrice}>₹{c.item.price} each</div>
                    </div>
                  </div>
                  <div className={styles.cartRowControls}>
                    <button onClick={() => removeFromCart(c.item.id)} className={styles.qtyBtn}>
                      <Minus size={12} />
                    </button>
                    <span className={styles.cartRowQty}>{c.quantity}</span>
                    <button onClick={() => addToCart(c.item)} className={styles.qtyBtn}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className={styles.totalSummaryRow}>
                <span>Subtotal Price:</span>
                <span className={styles.totalPriceValue}>₹{cartTotal}</span>
              </div>

              <div className={styles.infoAlert}>
                <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span>Orders are linked directly to your room <strong>({activeThemeLabel})</strong>. No online payment required, pay at the end!</span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsCartOpen(false)}
                style={{ flex: 1 }}
              >
                Keep Browsing
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                style={{ flex: 1 }}
              >
                Proceed to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {isCheckoutOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCheckoutOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🍽️ Confirm Room Service Order</h3>
              <button className={styles.closeBtn} onClick={() => setIsCheckoutOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div className={styles.modalBody}>
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabel}>Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className={styles.formInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabel}>Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className={styles.formInput}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabel}>Any Special Instructions? (Optional)</label>
                  <textarea
                    placeholder="e.g. Serve cold coffee after 30 mins, make nachos extra spicy..."
                    className={styles.formTextarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.finalBillSummary}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Delivering to:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{activeThemeLabel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Total Amount to Pay:</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '1.2rem' }}>₹{cartTotal}</span>
                  </div>
                </div>

                {errorMsg && <div className={styles.formError}>{errorMsg}</div>}
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsCheckoutOpen(false)}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Placing Order...' : 'Send Order to Kitchen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle2 size={64} style={{ filter: 'drop-shadow(var(--accent-glow))' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: '12px', fontSize: '1.8rem' }}>Order Placed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Your order <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{orderSuccess.id}</strong> has been sent to our kitchen. 
              We will serve it directly to the <strong>{activeThemeLabel}</strong> shortly.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Items: </span>
              <strong>{orderSuccess.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}</strong>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setOrderSuccess(null)}
              style={{ width: '100%' }}
            >
              Order More / Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0c', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#ff2e7e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontFamily: 'Outfit, sans-serif' }}>Loading Sweet Cafe Menu...</p>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
