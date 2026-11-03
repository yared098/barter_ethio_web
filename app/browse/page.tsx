import Link from 'next/link';
import { apiFetch, RequestList } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { RequestCard } from '@/components/request-card';
import { MobilePrimaryNav } from '@/components/mobile-primary-nav';
import { BrowseRefresh } from '@/components/browse-refresh';

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
  const requests = data
    ? [...data.items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : [];

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

          {errorMsg && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              The wanted board could not be loaded. {errorMsg}
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="py-20 text-center text-ink-muted">
              <p className="mb-3 text-4xl">📭</p>
              <p className="mb-1 text-lg font-semibold">
                Nothing on the board yet.
              </p>
              <p className="text-sm">Be the first to post a request.</p>
              <Link
                href="/post"
                className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 font-bold text-white"
              >
                Post a request
              </Link>
            </div>
          )}

          {data && data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {requests.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    currentUserId={user?.id}
                  />
                ))}
              </div>

              <div className="mt-10 flex justify-center gap-3">
                {data.pagination.page > 1 && (
                  <Link
                    href={`/browse?page=${data.pagination.page - 1}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-ink-muted">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                {data.pagination.hasMore && (
                  <Link
                    href={`/browse?page=${data.pagination.page + 1}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </BrowseRefresh>
    </main>
  );
}