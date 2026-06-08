import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sellerId = searchParams.get('sellerId') || undefined;
    const onlyFeatured = searchParams.get('featured') === 'true';

    const listings = await db.listing.list({
      category,
      type,
      search,
      sortBy,
      sellerId,
      onlyFeatured
    });

    return NextResponse.json({ success: true, listings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/listings
export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (!user.profile) {
      return NextResponse.json({ error: 'Onboarding required. Set a Minecraft username first.' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, category, price, images, type, auctionDetails } = body;

    // Validation
    if (!title || !description || !category || price === undefined) {
      return NextResponse.json({ error: 'Title, description, category, and price/starting bid are required.' }, { status: 400 });
    }

    if (price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0.' }, { status: 400 });
    }

    // Determine non-automatic trade warning categories
    // Bases, Farms, Services, Other cannot be verified automatically.
    const manualCategories = ['Bases', 'Farms', 'Services', 'Other'];
    const propertyWarning = manualCategories.includes(category);

    const isAuction = type === 'AUCTION';
    let formattedAuctionDetails = undefined;

    if (isAuction) {
      if (!auctionDetails || !auctionDetails.endDate) {
        return NextResponse.json({ error: 'Auction end date is required.' }, { status: 400 });
      }
      
      const endDate = new Date(auctionDetails.endDate);
      if (endDate <= new Date()) {
        return NextResponse.json({ error: 'Auction end date must be in the future.' }, { status: 400 });
      }

      formattedAuctionDetails = {
        startingBid: Number(price),
        minimumIncrement: Number(auctionDetails.minimumIncrement || 1000),
        endDate
      };
    }

    const listing = await db.listing.create({
      title: title.trim(),
      description: description.trim(),
      category,
      price: Number(price),
      images: Array.isArray(images) && images.length > 0 ? images : ['/placeholder.png'],
      sellerId: user.id,
      type: isAuction ? 'AUCTION' : 'FIXED',
      propertyWarning,
      auctionDetails: formattedAuctionDetails
    });

    return NextResponse.json({ success: true, listing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
