import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: listingId } = params;
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (!user.profile) {
      return NextResponse.json({ error: 'Onboarding required. Set a Minecraft username first.' }, { status: 400 });
    }

    const { amount } = await req.json();
    if (amount === undefined || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid bid amount.' }, { status: 400 });
    }

    const listing = await db.listing.get(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.type !== 'AUCTION' || !listing.auction) {
      return NextResponse.json({ error: 'This listing is not an auction.' }, { status: 400 });
    }

    if (listing.sellerId === user.id) {
      return NextResponse.json({ error: 'You cannot bid on your own auction.' }, { status: 400 });
    }

    if (listing.auction.status !== 'ACTIVE' || new Date() > new Date(listing.auction.endDate)) {
      return NextResponse.json({ error: 'This auction has ended or is inactive.' }, { status: 400 });
    }

    const result = await db.auction.placeBid(user.id, listing.auction.id, Number(amount));
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to place bid' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
