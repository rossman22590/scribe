import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@saru/db';
import { user, session } from '@saru/db';
import { eq } from 'drizzle-orm';

const ALLOWED_SSO_ORIGINS = ['myapps.ai', 'account.myapps.ai'];
const ALLOWED_LOCALHOST_PORTS = ['3000', '3001'];

function isAllowedOrigin(referer: string | null): boolean {
  // Allow if referer is missing or stripped (e.g. window.open with noopener)
  if (!referer) return true;
  try {
    const url = new URL(referer);
    const hostname = url.hostname;
    const port = url.port;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ALLOWED_LOCALHOST_PORTS.includes(port);
    }

    return hostname === 'myapps.ai' || hostname.endsWith('.myapps.ai');
  } catch {
    return false;
  }
}

/** Generate a random base62 ID matching better-auth style */
function generateId(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export async function GET(request: NextRequest) {
  // 1. Enforce Referer origin check
  const referer = request.headers.get('referer');
  if (!isAllowedOrigin(referer)) {
    console.warn(`[SSO] Rejected: invalid referer: ${referer}`);
    return NextResponse.json({ error: 'Access denied: invalid origin' }, { status: 403 });
  }

  // 2. Extract and validate the SSO token
  const ssoToken = request.nextUrl.searchParams.get('sso_token');
  if (!ssoToken) {
    return NextResponse.json({ error: 'Missing sso_token parameter' }, { status: 400 });
  }

  const parts = ssoToken.split('.');
  if (parts.length !== 2) {
    return NextResponse.json({ error: 'Invalid SSO token format' }, { status: 400 });
  }

  const [subject, signature] = parts;
  const subParts = subject.split(':');
  if (subParts.length !== 2) {
    return NextResponse.json({ error: 'Invalid SSO token subject' }, { status: 400 });
  }

  const [userId, issuedAtStr] = subParts;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (!userId || isNaN(issuedAt)) {
    return NextResponse.json({ error: 'Invalid SSO token parameters' }, { status: 400 });
  }

  // Check token age (5-minute window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - issuedAt) > 300) {
    return NextResponse.json({ error: 'SSO token expired' }, { status: 401 });
  }

  // Verify HMAC-SHA256 signature
  const secret = process.env.SSO_SHARED_SECRET || 'scribe-sso-shared-secret-key-2026';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(subject)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid SSO token signature' }, { status: 401 });
  }

  try {
    // 3. Look up the user in Scribe's DB
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Create a new session in the database (direct DB insert matching better-auth format)
    const sessionToken = generateId(32);
    const sessionId = generateId(32);
    const now2 = new Date();
    const expiresAt = new Date(now2.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(session).values({
      id: sessionId,
      token: sessionToken,
      userId: dbUser.id,
      expiresAt,
      createdAt: now2,
      updatedAt: now2,
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '',
      userAgent: request.headers.get('user-agent') ?? '',
    });

    // 5. Set the better-auth session cookie
    // Cookie name: better-auth.session_token (as used by getSessionCookie in middleware)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction
      ? '__Secure-better-auth.session_token'
      : 'better-auth.session_token';

    const redirectUrl = request.nextUrl.searchParams.get('next') || '/documents';
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    console.log(`[SSO] User ${dbUser.email} logged in via SSO from ${referer}`);
    return response;
  } catch (err: any) {
    console.error('[SSO] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
