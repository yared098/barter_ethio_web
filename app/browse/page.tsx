import Link from 'next/link';
import { apiFetch, type RequestList } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { MobilePrimaryNav } from '@/components/mobile-primary-nav';
import { BrowseRefresh } from '@/components/browse-refresh';
import { BrowseRequests } from '@/components/browse-requests';

export const metadata = {
  title: 'Wanted board',
  description: 'Browse active barter requests in Ethiopia.',
};

export const revalidate = 0; // always fresh — user-specific

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categoryId?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const categoryId = sp.categoryId;
  const token = await getAccessToken();
  const user = token ? await getCurrentUser() : null;

  const qs = new URLSearchParams({
    scope: 'all',
    page: String(page),
    limit: '20',
    ...(categoryId && { categoryId }),
  });

  let data: RequestList | null = null;
  let errorMsg: string | null = null;

  try {
    data = await apiFetch<RequestList>(`/requests?${qs}`, { token });
  } catch (e: unknown) {
    errorMsg = e instanceof Error ? e.message : 'Could not load board';
  }
  if (data) {
    data = {
      ...data,
      items: [...data.items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-extrabold text-ink">
              Barter<span className="text-primary">Ethio</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {token ? (
              <Link
                href="/dashboard"
                className="hidden text-sm font-semibold text-ink-muted hover:text-primary sm:inline"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login?next=/browse"
                className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-full transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
        {user && <MobilePrimaryNav active="browse" />}
      </nav>

      <BrowseRefresh>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-black text-ink">Wanted board</h1>
            <p className="text-ink-muted">
              What people are looking for right now.
            </p>
          </div>

          <BrowseRequests
            initialData={data}
            initialError={
              errorMsg ? `The wanted board could not be loaded. ${errorMsg}` : null
            }
            initialPage={page}
            categoryId={categoryId}
            currentUserId={user?.id}
          />
        </div>
      </BrowseRefresh>
    </main>
  );
}