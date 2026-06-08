import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest, props: { params: Promise<{ username: string }> }) {
  try {
    const params = await props.params;
    const { username } = params;
    
    // Find profile by Minecraft username
    const profile = await db.user.findByMinecraftUsername(username);
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch user details to verify role/status
    const user = await db.user.findUnique({ id: profile.userId });
    if (!user || user.status === 'BANNED') {
      return NextResponse.json({ error: 'This user account is suspended or unavailable' }, { status: 404 });
    }

    // Get active listings by this user
    const listings = await db.listing.list({ sellerId: user.id });
    const activeListings = listings.filter(l => l.status === 'ACTIVE');

    // Get reviews received by this user
    const reviews = await db.reviews.listForUser(user.id);

    return NextResponse.json({
      success: true,
      profile: {
        userId: profile.userId,
        minecraftUsername: profile.minecraftUsername,
        discordUsername: profile.discordUsername,
        avatarUrl: profile.avatarUrl,
        completedTrades: profile.completedTrades,
        averageRating: profile.averageRating,
        reviewCount: profile.reviewCount,
        verified: profile.verified,
        createdAt: profile.createdAt
      },
      listings: activeListings,
      reviews
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
