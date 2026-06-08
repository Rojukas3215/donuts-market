import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST /api/player/sync
// Sync player account from Minecraft server
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    // Simulated token validation: e.g. Bearer donut_secret_token_123
    const apiToken = authHeader?.split(' ')[1];
    
    const body = await req.json();
    const { uuid, username, email } = body;

    if (!uuid || !username) {
      return NextResponse.json({ error: 'UUID and Username are required' }, { status: 400 });
    }

    // In a real plugin integration, we would verify the secret token:
    // if (apiToken !== process.env.PLUGIN_API_SECRET) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Mock search for user by email, or profile by Minecraft username
    let profile = await db.user.findByMinecraftUsername(username);
    
    if (profile) {
      // Profile exists, we sync data (like completedTrades count or update avatar)
      return NextResponse.json({
        success: true,
        message: 'Player profile already linked and synchronized.',
        profile
      });
    }

    // If email is provided, we can auto-link. Otherwise we return a linking code.
    if (email) {
      const user = await db.user.findUnique({ email });
      if (user) {
        profile = await db.user.updateProfile(user.id, {
          minecraftUsername: username,
          avatarUrl: `https://mc-heads.net/avatar/${username}`
        });
        return NextResponse.json({
          success: true,
          message: `Successfully linked Minecraft account ${username} with user email ${email}.`,
          profile
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pending link. Please register on the web using this Minecraft username.',
      linkCode: `DNUT-${Math.floor(100000 + Math.random() * 900000)}`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
