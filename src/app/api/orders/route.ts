import { NextRequest, NextResponse } from 'next/server';
import { readDb, addFoodOrder, updateFoodOrderStatus } from '@/lib/db';

function isAuthorized(request: NextRequest): boolean {
  const passcode = request.headers.get('X-Admin-Passcode');
  const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';
  return passcode === serverPasscode;
}

// GET all food orders (Admin endpoint)
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const db = readDb();
    const orders = db.foodOrders || [];
    
    // Sort by order time (newest first)
    const sortedOrders = [...orders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ orders: sortedOrders });
  } catch (error: any) {
    console.error('Error fetching food orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new food order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, themeLabel, customerName, phone, items, totalPrice } = body;

    // Validation
    if (!theme || !themeLabel || !items || !Array.isArray(items) || items.length === 0 || totalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 });
    }

    const newOrder = addFoodOrder({
      theme,
      themeLabel,
      customerName: customerName ? String(customerName).trim() : 'Guest',
      phone: phone ? String(phone).trim() : '',
      items,
      totalPrice: Number(totalPrice),
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
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

    const updatedOrder = updateFoodOrderStatus(id, status);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating food order status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
