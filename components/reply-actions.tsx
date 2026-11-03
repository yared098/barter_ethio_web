'use client';

import { useState, useTransition } from 'react';
import { acceptReplyAction, withdrawReplyAction } from '@/app/browse/[id]/actions';

type Props = {
  requestId: string;
  replyId: string;
  isAuthor: boolean;
};

export function ReplyActions({ requestId, replyId, isAuthor }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e: unknown) {
        // Next.js `redirect()` throws a special internal error — re-throw it
        const digest = (e as { digest?: string })?.digest;
        if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
          throw e;
        }
        setError(
          e instanceof Error ? e.message : 'Something went wrong',
        );
      }
    });
  }

  if (isAuthor) {
    return (
      <div>
        {confirming ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run(() => acceptReplyAction(requestId, replyId))}
              disabled={pending}
              className="flex-1 bg-primary text-white font-bold text-sm py-2 rounded-lg disabled:opacity-50"
            >
              {pending ? 'Accepting…' : 'Confirm accept'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="px-3 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full border border-primary text-primary font-bold text-sm py-2 rounded-lg hover:bg-primary/5 transition"
          >
            Accept this reply
          </button>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => run(() => withdrawReplyAction(requestId, replyId))}
        disabled={pending}
        className="w-full border border-border text-ink-muted font-semibold text-sm py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
      >
        {pending ? 'Withdrawing…' : 'Withdraw my reply'}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}