import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST /api/auction/sync
// Sync auction bid updates with the Minecraft server
// E.g. in-game scoreboard showing highest bid, or sending in-game broadcast
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { auctionId } = body;

    if (!auctionId) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
    }

    // In a real plugin, this would lookup the active auction details and return them
    // so that the server can display the highest bid in-game on a hologram or chat announcement.
    // For MVP, we mock the retrieval and broadcast state.
    const listings = await db.listing.list();
    const auctionListing = listings.find(l => l.auction?.id === auctionId);
    
    if (!auctionListing || !auctionListing.auction) {
      return NextResponse.json({ error: 'Active auction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      auctionId,
      listingId: auctionListing.id,
      title: auctionListing.title,
      currentBid: auctionListing.auction.currentBid,
      currentBidder: auctionListing.auction.currentBidderUsername || 'None',
      endDate: auctionListing.auction.endDate,
      status: auctionListing.auction.status,
      message: 'Auction states retrieved and synchronized with in-game board.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
