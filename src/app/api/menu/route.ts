import { NextRequest, NextResponse } from 'next/server';
import { readDb, addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/db';

function isAuthorized(request: NextRequest): boolean {
  const passcode = request.headers.get('X-Admin-Passcode');
  const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';
  return passcode === serverPasscode;
}

// GET all menu items
export async function GET(request: NextRequest) {
  try {
    const db = readDb();
    const menuItems = db.menuItems || [];
    return NextResponse.json({ menuItems });
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new menu item
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, description, category, icon } = body;

    if (!name || price === undefined || !category || !icon) {
      return NextResponse.json({ error: 'Missing required menu fields (name, price, category, icon).' }, { status: 400 });
    }

    const newItem = addMenuItem({
      name: String(name).trim(),
      price: Number(price),
      description: description ? String(description).trim() : '',
      category,
      icon: String(icon).trim()
    });

    return NextResponse.json({ success: true, menuItem: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

// PUT update a menu item
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, price, description, category, inStock, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required.' }, { status: 400 });
    }

    const updatedItem = updateMenuItem({
      id,
      name,
      price,
      description,
      category,
      inStock,
      icon
    });

    return NextResponse.json({ success: true, menuItem: updatedItem });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

// DELETE a menu item
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required.' }, { status: 400 });
    }

    deleteMenuItem(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
