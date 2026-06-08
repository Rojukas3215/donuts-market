import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user exists
    const existing = await db.user.findUnique({ email });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const user = await db.user.create({
      email,
      password: hashedPassword,
      role: 'USER'
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasProfile: false
      }
    });

    // Sign session
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
