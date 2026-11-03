import { cookies } from 'next/headers';
import { apiFetch } from './api';

export const ACCESS_COOKIE = 'barter_access';
export const REFRESH_COOKIE = 'barter_refresh';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  tier: 'FREE' | 'DAILY' | 'CREDIT' | 'PRO';
  proExpiresAt: string | null;
  proBudgetRemaining: number | null;
  dailyPassExpiresAt: string | null;
  creditsRemaining: number;
  postsTodayCount: number;
  postsTodayDate: string | null;
  totalPostsMade: number;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramLinkedAt: string | null;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
};
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await apiFetch<SessionUser>('/auth/me', { token });
  } catch {
    return null;
  }
}