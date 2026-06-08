import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tradeTicketId, rating, text } = await req.json();

    if (!tradeTicketId || rating === undefined || !text) {
      return NextResponse.json({ error: 'Trade Ticket ID, rating, and review text are required.' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
    }

    // Get Trade Ticket
    const ticket = await db.trade.get(tradeTicketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Trade Ticket not found.' }, { status: 404 });
    }

    if (ticket.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Reviews can only be left for completed trades.' }, { status: 400 });
    }

    // Verify user is either buyer or seller in this ticket
    if (ticket.buyerId !== user.id && ticket.sellerId !== user.id) {
      return NextResponse.json({ error: 'You are not a participant in this trade.' }, { status: 403 });
    }

    // Create review
    const review = await db.reviews.create(user.id, tradeTicketId, numericRating, text.trim());
    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
