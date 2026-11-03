import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import { type MatchesResponse } from '@/lib/matches';
import { MatchCard } from '@/components/match-card';
import { MatchTeaserCard } from '@/components/match-teaser-card';

export const metadata = { title: 'Your matches' };

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/matches');

  const token = await getAccessToken();

  let data: MatchesResponse | null = null;
  try {
    data = await apiFetch<MatchesResponse>('/matches', { token });
  } catch {}

  if (!data) {
    return (
      <main className="min-h-screen bg-white">
        <nav className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-ink-muted hover:text-primary"
            >
              ← Dashboard
            </Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center text-ink-muted">
          <p>Could not load matches. Try again later.</p>
        </div>
      </main>
    );
  }

  const { matches, teaserMatches, totalCount, hiddenCount, tier, aiRanked } =
    data;
  const isFree = tier === 'FREE';

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-ink-muted hover:text-primary transition"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 12H5M12 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-semibold">Dashboard</span>
          </Link>
          <h1 className="font-black text-ink">Your matches</h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-ink">
              {totalCount} match{totalCount === 1 ? '' : 'es'}
            </h2>
            {aiRanked && (
              <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                ⚡ AI-ranked
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted">
            Products that fit what you&apos;re looking for — ranked by how
            well they match.
          </p>
        </div>

        {/* No matches */}
        {matches.length === 0 && teaserMatches.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-bold text-ink mb-2">No matches yet</p>
            <p className="text-sm text-ink-muted mb-6 max-w-md mx-auto">
              List a product with your wants to start seeing matches here.
            </p>
            <Link
              href="/product/new"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full transition"
            >
              📦 List a product
            </Link>
          </div>
        )}

        {/* Full matches */}
        {matches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {matches.map((m) => (
              <MatchCard key={m.product.id} match={m} />
            ))}
          </div>
        )}

        {/* Free tier — locked teasers */}
        {isFree && teaserMatches.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-ink-muted bg-primary-light px-3 py-1.5 rounded-full">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                {hiddenCount} more locked
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {teaserMatches.map((t) => (
                <MatchTeaserCard key={t.id} teaser={t} />
              ))}
            </div>

            <div className="mt-6 bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-center">
              <p className="text-white font-black text-lg mb-1">
                Unlock {hiddenCount} more match{hiddenCount === 1 ? '' : 'es'}
              </p>
              <p className="text-white/80 text-sm mb-4 max-w-md mx-auto">
                Upgrade to PRO or buy a credit pack to see every match — plus
                unlimited listings, no daily caps.
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-white text-primary hover:bg-primary-light font-black px-6 py-3 rounded-full transition"
              >
                View plans →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}