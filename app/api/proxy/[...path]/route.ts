import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

function setSessionCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const token = req.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const apiPath = '/' + path.join('/');
  const search = req.nextUrl.search || '';

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

  try {
    const data = await apiFetch(apiPath + search, {
      method: req.method,
      token,
      body,
    });
    return NextResponse.json(data);
  } catch (e: any) {
    if (e?.status === 401 && refreshToken) {
      try {
        const tokens = await apiFetch<{
          accessToken: string;
          refreshToken: string;
        }>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
        const data = await apiFetch(apiPath + search, {
          method: req.method,
          token: tokens.accessToken,
          body,
        });
        const response = NextResponse.json(data);
        setSessionCookies(response, tokens);
        return response;
      } catch (refreshError: any) {
        const status =
          typeof refreshError?.status === 'number'
            ? refreshError.status
            : e.status || 500;
        const response = NextResponse.json(
          refreshError?.body || {
            message: refreshError?.message || 'Session refresh failed',
          },
          { status },
        );
        if (status === 401) {
          response.cookies.delete(ACCESS_COOKIE);
          response.cookies.delete(REFRESH_COOKIE);
        }
        return response;
      }
    }

    return NextResponse.json(
      e?.body || { message: e?.message || 'Proxy error' },
      { status: e?.status || 500 },
    );
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };