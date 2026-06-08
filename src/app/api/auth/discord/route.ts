import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { discordUsername, email } = await req.json();

    const targetEmail = email || `discord_${Math.random().toString(36).substr(2, 9)}@donutmarket.com`;
    const targetDiscord = discordUsername || `DiscordUser#${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if user exists by email
    let user = await db.user.findUnique({ email: targetEmail });
    let isNew = false;

    if (!user) {
      // Create a new user with empty password (since it is OAuth)
      user = await db.user.create({
        email: targetEmail,
        password: '', // OAuth users don't have passwords
        role: 'USER'
      });
      isNew = true;
    }

    if (user.status === 'BANNED') {
      return NextResponse.json({ error: 'This account has been banned' }, { status: 403 });
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasProfile: !!user.profile,
        discordUsername: targetDiscord
      }
    });

    setSessionCookie(res, {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
