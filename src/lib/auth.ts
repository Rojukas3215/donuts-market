import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import db, { User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'donut_smp_super_secret_session_key_2026';
const COOKIE_NAME = 'donut_session';

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

// Hash password helper
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Compare password helper
export function comparePassword(password: string, hashed: string): boolean {
  return bcrypt.compareSync(password, hashed);
}

// Sign session token
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify session token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Get session from request cookies
export async function getSession(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await db.user.findUnique({ id: payload.userId });
    if (user) {
      if (user.status === 'BANNED') return null;
      return user;
    }
  } catch {
    // DB unavailable — fall through to JWT fallback
  }

  // JWT fallback: reconstruct a minimal user from the verified token
  // This keeps users logged in even when the DB is temporarily unreachable
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role as any,
    status: 'ACTIVE',
    createdAt: new Date(),
    profile: undefined,
  };
}

// Set session cookie on response
export function setSessionCookie(res: NextResponse, payload: JWTPayload) {
  const token = signToken(payload);
  
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

// Clear session cookie on response
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
}
