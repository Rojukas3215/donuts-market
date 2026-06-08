import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const stats = await db.admin.getStats();
    // Return only public stats for homepage
    return NextResponse.json({
      success: true,
      stats: {
        totalListings: stats.totalListings,
        completedTrades: stats.completedTrades,
        registeredUsers: stats.registeredUsers,
        activeAuctions: stats.activeAuctions
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
