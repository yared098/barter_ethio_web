import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

export const runtime = 'nodejs';

// ─── Adjust these to match your app ─────────────────────────────────
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_TTL_SECONDS = 60 * 15;            // 15 min
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
// ────────────────────────────────────────────────────────────────────

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? '');
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET ?? '');

type RefreshPayload = {
  sub: string;
  email?: string;
  name?: string;
};

export async function POST(req: NextRequest) {
  if (accessSecret.length === 0 || refreshSecret.length === 0) {
    return NextResponse.json(
      { error: 'Server misconfigured: JWT secrets missing' },
      { status: 500 },
    );
  }

  const token = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  let payload: RefreshPayload;
  try {
    const { payload: p } = await jwtVerify(token, refreshSecret);
    if (!p.sub) throw new Error('Missing sub');
    payload = {
      sub: String(p.sub),
      email: typeof p.email === 'string' ? p.email : undefined,
      name: typeof p.name === 'string' ? p.name : undefined,
    };
  } catch {
    const res = NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  // Rotate both tokens
  const accessToken = await new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(accessSecret);

  const newRefreshToken = await new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(refreshSecret);

  const res = NextResponse.json({ accessToken });
  res.cookies.set(REFRESH_COOKIE, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TTL_SECONDS,
  });
  return res;
}