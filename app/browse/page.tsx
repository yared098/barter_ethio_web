import Link from 'next/link';
import { apiFetch, RequestList } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { RequestCard } from '@/components/request-card';

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
                className="text-sm font-semibold text-ink-muted hover:text-primary"
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
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Wanted board</h1>
          <p className="text-ink-muted">What people are looking for right now.</p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 text-sm"
          >
            The wanted board could not be loaded. {errorMsg}
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="text-center py-20 text-ink-muted">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-semibold mb-1">Nothing on the board yet.</p>
            <p className="text-sm">Be the first to post a request.</p>
            <Link
              href="/post"
              className="inline-block mt-6 bg-primary text-white font-bold px-5 py-2.5 rounded-full"
            >
              Post a request
            </Link>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.items.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-10">
              {data.pagination.page > 1 && (
                <Link
                  href={`/browse?page=${data.pagination.page - 1}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                  className="px-4 py-2 rounded-full border border-border hover:border-primary/40 text-sm font-semibold"
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
                  className="px-4 py-2 rounded-full border border-border hover:border-primary/40 text-sm font-semibold"
                >
                  Next →
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}