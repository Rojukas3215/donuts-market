import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetType, targetId, reason } = await req.json();

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'Target Type, Target ID, and reason are required' }, { status: 400 });
    }

    if (!['USER', 'LISTING', 'TRADE'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid report target type' }, { status: 400 });
    }

    const report = await db.report.create(user.id, targetType as any, targetId, reason.trim());
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
