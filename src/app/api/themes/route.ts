import { NextRequest, NextResponse } from 'next/server';
import { getAllThemes, updateThemeInFirestore } from '@/lib/firestore';
import { isAuthorized } from '@/lib/auth';

// GET all celebration themes with current prices & imagery
export async function GET() {
  try {
    const themes = await getAllThemes();
    return NextResponse.json({ success: true, themes });
  } catch (error: any) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update a theme's costs, cover image, gallery, and details
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, price, extraGuestPrice, image, galleryImages, description, name, badge, duration, maxGuests, includedGuests } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Theme ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (price !== undefined) updates.price = Number(price);
    if (extraGuestPrice !== undefined) updates.extraGuestPrice = Number(extraGuestPrice);
    if (image !== undefined) updates.image = String(image).trim();
    if (galleryImages !== undefined && Array.isArray(galleryImages)) {
      updates.galleryImages = galleryImages.map((img: any) => String(img).trim()).filter(Boolean);
    }
    if (description !== undefined) updates.description = String(description).trim();
    if (name !== undefined) updates.name = String(name).trim();
    if (badge !== undefined) updates.badge = String(badge).trim();
    if (duration !== undefined) updates.duration = String(duration).trim();
    if (maxGuests !== undefined) updates.maxGuests = Number(maxGuests);
    if (includedGuests !== undefined) updates.includedGuests = Number(includedGuests);

    const updatedTheme = await updateThemeInFirestore(id, updates);
    return NextResponse.json({ success: true, theme: updatedTheme });
  } catch (error: any) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
