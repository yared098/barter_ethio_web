import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }

  try {
    const session = await apiFetch<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    const secure = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ ok: true });
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
      error instanceof Error ? error.message : 'Session refresh failed';
    const response = NextResponse.json({ message }, { status });
    if (status === 401) {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
    }
    return response;
  }
}