import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/trades/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await db.trade.get(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Trade Ticket not found' }, { status: 404 });
    }

    // Verify user is participant
    if (ticket.buyerId !== user.id && ticket.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/trades/[id]
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await db.trade.get(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Trade Ticket not found' }, { status: 404 });
    }

    // Verify user is participant or admin
    if (ticket.buyerId !== user.id && ticket.sellerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update status
    const success = await db.trade.updateStatus(id, status as any, user.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update trade status' }, { status: 500 });
    }

    // Log admin action if resolved by admin
    if (user.role === 'ADMIN' && ticket.buyerId !== user.id && ticket.sellerId !== user.id) {
      await db.admin.log(user.id, 'RESOLVE_TRADE', id, `Admin set trade status to ${status}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
