import Link from 'next/link';
import type { PostingStatus } from '@/lib/payments';

type Props = { status: PostingStatus };

const MODE_LABELS: Record<PostingStatus['mode'], string> = {
  FREE: 'Free plan',
  DAILY: 'Daily pass',
  CREDIT: 'Credit pack',
  PRO: 'PRO',
};

const MODE_BADGE: Record<PostingStatus['mode'], string> = {
  FREE: 'bg-gray-100 text-gray-700',
  DAILY: 'bg-blue-50 text-blue-700',
  CREDIT: 'bg-purple-50 text-purple-700',
  PRO: 'bg-primary-light text-primary',
};

export function PostingStatusPanel({ status }: Props) {
  const pct =
    status.dailyCap > 0
      ? Math.min(100, (status.postsUsedToday / status.dailyCap) * 100)
      : 0;

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Posting today</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${MODE_BADGE[status.mode]}`}>
          {MODE_LABELS[status.mode]}
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-3xl font-black text-ink">
          {status.postsUsedToday}
          <span className="text-lg text-ink-muted">/{status.dailyCap}</span>
        </span>
        <span className="text-xs text-ink-muted font-semibold">
          {status.postsLeftToday} left today
        </span>
      </div>

      <div className="h-2 bg-divider rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {status.mode === 'PRO' && (
          <>
            <div>
              <div className="text-ink-muted mb-0.5">PRO budget</div>
              <div className="font-bold text-ink">{status.budgetLeft} posts</div>
            </div>
            <div>
              <div className="text-ink-muted mb-0.5">Days left</div>
              <div className="font-bold text-ink">{status.proDaysLeft} days</div>
            </div>
          </>
        )}
        {status.mode === 'CREDIT' && (
          <div className="col-span-2">
            <div className="text-ink-muted mb-0.5">Credits remaining</div>
            <div className="font-bold text-ink">{status.creditsRemaining} posts</div>
          </div>
        )}
        {status.mode === 'DAILY' && status.dailyPassExpiresAt && (
          <div className="col-span-2">
            <div className="text-ink-muted mb-0.5">Pass expires</div>
            <div className="font-bold text-ink">
              {new Date(status.dailyPassExpiresAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {status.mode === 'FREE' && (
        <Link
          href="/upgrade"
          className="mt-5 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-full text-center block transition"
        >
          Upgrade for more posts
        </Link>
      )}

      {!status.canPost && status.reason && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
          {status.reason}
        </div>
      )}
    </div>
  );
}