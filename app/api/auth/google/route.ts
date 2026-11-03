import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: { credential?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.credential) {
    return NextResponse.json({ message: 'Missing credential' }, { status: 400 });
  }

  try {
    const data = await apiFetch<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: body.credential }),
    });

    const secure = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ ok: true, user: data.user });

    res.cookies.set(ACCESS_COOKIE, data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 min
    });
    res.cookies.set(REFRESH_COOKIE, data.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Sign-in failed' },
      { status: e?.status === 401 ? 401 : 500 },
    );
  }
}