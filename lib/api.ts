const API_BASE = process.env.API_URL!;

if (!API_BASE) throw new Error('API_URL is not set in .env.local');

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: any,
    message?: string,
  ) {
    super(message || `API ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: 'no-store',
  });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) throw new ApiError(res.status, body, body?.message);
  return body as T;
}

// ── Types ──
export type Category = {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
};

export type Request = {
  id: string;
  title: string;
  description: string;
  images: string[];
  status: 'OPEN' | 'CLOSED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  type: 'BUY' | 'BARTER' | 'EITHER';
  budgetMin: number | null;
  budgetMax: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  isLocationRestricted: boolean;
  categoryId: string;
  authorId: string;
  createdAt: string;
  author?: { id: string; name: string | null; email: string; image: string | null };
  category?: Category;
  _count?: { responses: number };
};

export type RequestList = {
  items: Request[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// ── Request creation payload ──
export type CreateRequestPayload = {
  title: string;
  description: string;
  categoryId: string;
  type?: 'BUY' | 'BARTER' | 'EITHER';
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  isLocationRestricted?: boolean;
};