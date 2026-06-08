import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/trades/[id]/messages
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: tradeTicketId } = params;
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await db.trade.get(tradeTicketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Trade Ticket not found' }, { status: 404 });
    }

    if (ticket.buyerId !== user.id && ticket.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await db.trade.getMessages(tradeTicketId);
    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/trades/[id]/messages
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: tradeTicketId } = params;
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await db.trade.get(tradeTicketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Trade Ticket not found' }, { status: 404 });
    }

    if (ticket.buyerId !== user.id && ticket.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content, attachmentUrls } = await req.json();
    if ((!content || content.trim() === '') && (!attachmentUrls || attachmentUrls.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachments required' }, { status: 400 });
    }

    const message = await db.trade.sendMessage(
      tradeTicketId,
      user.id,
      (content || '').trim(),
      attachmentUrls || []
    );

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
