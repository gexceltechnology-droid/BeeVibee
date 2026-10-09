import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import {
  getAllOrders,
  addOrderToFirestore,
  updateOrderStatusInFirestore,
  getAllMenuItems,
  DEFAULT_MENU_ITEMS,
} from '@/lib/firestore';
import { notifyAdminOnWhatsAppAndSMS } from '@/lib/whatsapp';

// GET all food orders (Admin endpoint)
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }
    const orders = await getAllOrders();
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching food orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new food order with authoritative server-side price validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, themeLabel, customerName, phone, items, totalPrice, notes } = body;

    if (!theme || !themeLabel || !items || !Array.isArray(items) || items.length === 0 || totalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 });
    }

    // 1. Fetch official menu items to validate prices authoritatively
    let officialMenuItems = await getAllMenuItems().catch(() => DEFAULT_MENU_ITEMS);
    if (!officialMenuItems || officialMenuItems.length === 0) {
      officialMenuItems = DEFAULT_MENU_ITEMS;
    }

    const menuMap = new Map<string, number>();
    for (const m of officialMenuItems) {
      menuMap.set(m.id.toLowerCase(), m.price);
      menuMap.set(m.name.trim().toLowerCase(), m.price);
    }

    // 2. Validate items and recalculate true total on server
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return NextResponse.json({ error: 'Invalid order item structure.' }, { status: 400 });
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const itemId = String(item.id || '').trim().toLowerCase();
      const itemName = String(item.name || '').trim();
      const itemNameKey = itemName.toLowerCase();

      // Look up authoritative price by ID or Name
      let authoritativePrice = menuMap.get(itemId);
      if (authoritativePrice === undefined) {
        authoritativePrice = menuMap.get(itemNameKey);
      }

      // If item not found in menu, fall back to default list lookup
      if (authoritativePrice === undefined) {
        const foundFallback = DEFAULT_MENU_ITEMS.find(
          (d) => d.id.toLowerCase() === itemId || d.name.toLowerCase() === itemNameKey
        );
        if (foundFallback) {
          authoritativePrice = foundFallback.price;
        }
      }

      if (authoritativePrice === undefined) {
        return NextResponse.json(
          { error: `Item "${itemName || itemId}" is not available on the official menu.` },
          { status: 400 }
        );
      }

      calculatedTotal += authoritativePrice * qty;
      validatedItems.push({
        id: item.id || `menu-${validatedItems.length + 1}`,
        name: itemName,
        price: authoritativePrice,
        quantity: qty,
      });
    }

    // 3. Enforce strict server-side price check against client-provided price
    const clientPrice = Number(totalPrice);
    if (isNaN(clientPrice) || Math.abs(clientPrice - calculatedTotal) > 1) {
      return NextResponse.json(
        {
          error: `Order price mismatch. Server calculated: ₹${calculatedTotal}, Client sent: ₹${clientPrice}.`,
        },
        { status: 400 }
      );
    }

    const rawTheme = String(theme).trim().toLowerCase();
    const validatedTheme: 'pink' | 'purple' | 'red' = (rawTheme === 'purple' || rawTheme === 'red') ? rawTheme : 'pink';

    const newOrder = await addOrderToFirestore({
      theme: validatedTheme,
      themeLabel: String(themeLabel).trim(),
      customerName: customerName ? String(customerName).trim() : 'Guest',
      phone: phone ? String(phone).trim() : '',
      items: validatedItems,
      totalPrice: calculatedTotal,
      notes: notes ? String(notes).trim() : undefined,
    });

    // Trigger automated server notification to admin phone, WhatsApp & Telegram (+919900106474)
    try {
      await notifyAdminOnWhatsAppAndSMS('food_order', newOrder);
    } catch (notifErr) {
      console.error('Admin food order notification error:', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating food order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

// PUT update food order status (Admin endpoint)
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Order ID and status are required.' }, { status: 400 });
    }

    if (status !== 'pending' && status !== 'preparing' && status !== 'served' && status !== 'cancelled') {
      return NextResponse.json({ error: 'Invalid order status value.' }, { status: 400 });
    }

    const updatedOrder = await updateOrderStatusInFirestore(id, status);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating food order status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
