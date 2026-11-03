import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const token = req.cookies.get(ACCESS_COOKIE)?.value ?? null;
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
    return NextResponse.json(
      e?.body || { message: e?.message || 'Proxy error' },
      { status: e?.status || 500 },
    );
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };