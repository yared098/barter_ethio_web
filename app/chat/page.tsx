import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import type { ChatOffer } from '@/lib/chat';
import { ChatList } from '@/components/chat-list';

export const metadata = { title: 'Chats' };

export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/chat');

  const token = await getAccessToken();

  let incoming: ChatOffer[] = [];
  let outgoing: ChatOffer[] = [];

  try {
    const [inRes, outRes] = await Promise.all([
      apiFetch<ChatOffer[]>('/offers?box=incoming', { token }),
      apiFetch<ChatOffer[]>('/offers?box=outgoing', { token }),
    ]);
    incoming = Array.isArray(inRes) ? inRes : [];
    outgoing = Array.isArray(outRes) ? outRes : [];
  } catch {}

  incoming.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  outgoing.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-ink-muted hover:text-primary transition"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-semibold">Back</span>
          </Link>

          <h1 className="font-black text-ink text-base">Chats</h1>

          <Link
            href="/browse"
            className="text-ink-muted hover:text-primary transition"
            aria-label="Browse"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto">
        <ChatList incoming={incoming} outgoing={outgoing} meId={user.id} />
      </div>
    </main>
  );
}