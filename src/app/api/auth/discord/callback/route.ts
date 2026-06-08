import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

// GET /api/auth/discord/callback
// Discord redirects here after the user authorizes on Discord's website
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=Discord+authorization+was+cancelled', appUrl));
  }

  try {
    // Step 1: Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${appUrl}/api/auth/discord/callback`,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || tokens.error) {
      console.error('Token exchange failed:', tokens);
      return NextResponse.redirect(new URL('/login?error=Failed+to+verify+Discord+account', appUrl));
    }

    // Step 2: Use access token to fetch the Discord user's profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!userResponse.ok || !discordUser.id) {
      console.error('Failed to fetch Discord user:', discordUser);
      return NextResponse.redirect(new URL('/login?error=Could+not+fetch+Discord+profile', appUrl));
    }

    // Discord requires the email scope — alert if missing
    const email = discordUser.email;
    if (!email) {
      return NextResponse.redirect(new URL('/login?error=Discord+account+must+have+a+verified+email', appUrl));
    }

    const discordUsername = discordUser.global_name || discordUser.username;

    // Step 3: Look up or create the user in the database
    let user = await db.user.findUnique({ email });

    if (!user) {
      // New user — create account, then redirect to onboarding
      user = await db.user.create({
        email,
        password: '', // OAuth users don't use passwords
        role: 'USER',
      });
    }

    if (user.status === 'BANNED') {
      return NextResponse.redirect(new URL('/login?error=This+account+has+been+banned', appUrl));
    }

    // Step 4: Set the session cookie
    const hasProfile = !!user.profile;
    const redirectPath = hasProfile ? '/' : '/onboarding';

    const response = NextResponse.redirect(new URL(redirectPath, appUrl));

    setSessionCookie(response, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return response;
  } catch (err: any) {
    console.error('Discord OAuth error:', err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`, appUrl)
    );
  }
}
