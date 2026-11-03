import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { type MatchesResponse } from '@/lib/matches';
import { MatchCard } from './match-card';
import { MatchTeaserCard } from './match-teaser-card';

type Props = {
  token: string | null;
  myProductsCount: number;
};

export async function DashboardMatchesSection({ token, myProductsCount }: Props) {
  // No products yet — matches can't exist
  if (myProductsCount === 0) {
    return (
      <section className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-divider">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-base font-black text-ink">Your matches</h2>
          </div>
        </div>
        <div className="px-6 py-10 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-sm font-bold text-ink mb-1">
            List a product to see your matches
          </p>
          <p className="text-xs text-ink-muted mb-4 max-w-md mx-auto leading-relaxed">
            Once you list something you want to trade, we&apos;ll show you
            people who have what you want — and who want what you have.
          </p>
          <Link
            href="/product/new"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition"
          >
            📦 List your first product
          </Link>
        </div>
      </section>
    );
  }

  let data: MatchesResponse | null = null;
  try {
    data = await apiFetch<MatchesResponse>('/matches', { token });
  } catch {
    return null;
  }

  if (!data) return null;

  const { matches, teaserMatches, totalCount, hiddenCount, tier } = data;
  const isFree = tier === 'FREE';
  const hasAny = matches.length > 0 || teaserMatches.length > 0;

  return (
    <section className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h2 className="text-base font-black text-ink">Your matches</h2>
          {totalCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
          {data.aiRanked && totalCount > 0 && (
            <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
              ⚡ AI
            </span>
          )}
        </div>
        {hasAny && (
          <Link
            href="/matches"
            className="text-xs font-bold text-primary hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      {/* Empty matches */}
      {!hasAny && (
        <div className="px-6 py-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm font-bold text-ink mb-1">
            No matches yet
          </p>
          <p className="text-xs text-ink-muted mb-4 max-w-md mx-auto leading-relaxed">
            We&apos;ll notify you as soon as someone lists something that
            matches your wants.
          </p>
          <Link
            href="/browse"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition"
          >
            Browse the board
          </Link>
        </div>
      )}

      {/* Match grid */}
      {hasAny && (
        <div className="p-4">
          {/* Full matches */}
          {matches.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {matches.map((m) => (
                <MatchCard key={m.product.id} match={m} />
              ))}
            </div>
          )}

          {/* Free tier teasers */}
          {isFree && teaserMatches.length > 0 && (
            <>
              <div className="flex items-center gap-2 my-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-ink-muted bg-primary-light px-2.5 py-1 rounded-full">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  {hiddenCount} more match{hiddenCount === 1 ? '' : 'es'} locked
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {teaserMatches.map((t) => (
                  <MatchTeaserCard key={t.id} teaser={t} />
                ))}
              </div>

              <div className="mt-5 bg-gradient-to-br from-primary to-primary-dark rounded-xl p-4 text-center">
                <p className="text-white font-black text-sm mb-1">
                  Unlock {hiddenCount} more match{hiddenCount === 1 ? '' : 'es'}
                </p>
                <p className="text-white/80 text-xs mb-3">
                  Upgrade to PRO or buy a credit pack — see every match, no
                  limits.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block bg-white text-primary hover:bg-primary-light font-black px-5 py-2 rounded-full text-xs transition"
                >
                  View plans →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}