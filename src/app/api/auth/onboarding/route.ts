import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { minecraftUsername, discordUsername } = await req.json();

    if (!minecraftUsername || minecraftUsername.trim() === '') {
      return NextResponse.json({ error: 'Minecraft username is required' }, { status: 400 });
    }

    // Check if Minecraft Username is already taken by another user profile
    const existingProfile = await db.user.findByMinecraftUsername(minecraftUsername);
    if (existingProfile && existingProfile.userId !== user.id) {
      return NextResponse.json({ error: 'Minecraft username is already registered' }, { status: 400 });
    }

    const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(minecraftUsername)}`;

    const profile = await db.user.updateProfile(user.id, {
      minecraftUsername: minecraftUsername.trim(),
      discordUsername: discordUsername ? discordUsername.trim() : null,
      avatarUrl
    });

    // Re-issue the JWT cookie with hasProfile: true so refreshing the page
    // keeps the user on the home screen instead of redirecting to /onboarding
    const res = NextResponse.json({ success: true, profile });
    setSessionCookie(res, {
      userId: user.id,
      email: user.email,
      role: user.role,
      hasProfile: true,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
