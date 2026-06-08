import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/admin/reports
export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reports = await db.report.list();
    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT /api/admin/reports
export async function PUT(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reportId, status, notes } = await req.json();
    if (!reportId || !status || !['RESOLVED', 'DISMISSED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const success = await db.report.resolve(reportId, user.id, status, notes || '');
    if (!success) {
      return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 });
    }

    // Audit log
    await db.admin.log(user.id, 'RESOLVE_REPORT', reportId, `Admin resolved report as ${status}. Notes: ${notes}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
