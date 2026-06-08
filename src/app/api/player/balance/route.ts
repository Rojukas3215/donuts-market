import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST /api/player/balance
// Query or sync player balance in-game
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, balance, action } = body; // action: 'query' | 'set' | 'add'

    if (!username) {
      return NextResponse.json({ error: 'Minecraft username is required' }, { status: 400 });
    }

    const profile = await db.user.findByMinecraftUsername(username);
    if (!profile) {
      return NextResponse.json({ error: 'Player profile not found on website' }, { status: 404 });
    }

    // In a real plugin, this would query/update the in-game Vault balance or custom dollars table.
    // For MVP, we mock the response.
    const currentBalance = balance !== undefined ? Number(balance) : 125000;

    return NextResponse.json({
      success: true,
      username,
      balance: currentBalance,
      updatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
