import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admins-service';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Rate limiting key based on IP + email
    const ip = request.headers.get('x-forwarded-for') || 'local';
    const rateLimitKey = `${ip}:${String(email).toLowerCase().trim()}`;

    const limitCheck = checkRateLimit(rateLimitKey);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || 'Too many failed attempts. Try again later.' },
        { status: 429 }
      );
    }

    const authResult = await authenticateAdmin(email, password);
    if (!authResult.success) {
      const attemptInfo = recordFailedAttempt(rateLimitKey);
      let errorMsg = authResult.error || 'Invalid credentials.';
      if (attemptInfo.remaining !== undefined && attemptInfo.remaining > 0) {
        errorMsg += ` (${attemptInfo.remaining} attempt(s) remaining before temporary lockout).`;
      }
      return NextResponse.json({ error: errorMsg }, { status: 401 });
    }

    // Success: reset rate limiter
    resetRateLimit(rateLimitKey);

    const token = signToken({
      adminId: authResult.admin.adminId,
      name: authResult.admin.name,
      email: authResult.admin.email,
      role: authResult.admin.role,
    });

    const response = NextResponse.json({
      success: true,
      user: authResult.admin,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}
