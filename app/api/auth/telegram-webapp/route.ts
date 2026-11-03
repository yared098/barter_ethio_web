import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let initData: unknown;
  try {
    ({ initData } = await req.json());
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof initData !== 'string' || !initData || initData.length > 8192) {
    return NextResponse.json(
      { message: 'Missing or invalid Telegram Web App data' },
      { status: 400 },
    );
  }

  try {
    const session = await apiFetch<{
      user: { id: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/telegram/webapp', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });

    const secure = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ ok: true, user: session.user });
    response.cookies.set(ACCESS_COOKIE, session.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });
    response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 500;
    const message =
      error instanceof Error ? error.message : 'Telegram sign-in failed';
    return NextResponse.json({ message }, { status });
  }
}
