import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/admin/users
export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await db.user.getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/admin/users
export async function PUT(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, status } = await req.json();
    if (!userId || !status || !['ACTIVE', 'BANNED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot ban yourself' }, { status: 400 });
    }

    const success = await db.user.updateStatus(userId, status);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    // Audit log
    await db.admin.log(user.id, 'UPDATE_USER_STATUS', userId, `Admin updated user status to ${status}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
