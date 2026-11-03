'use client';

import { useState, useTransition } from 'react';
import {
  acceptReplyAction,
  rejectReplyAction,
  withdrawReplyAction,
} from '@/app/browse/[id]/actions';

type Props = {
  requestId: string;
  replyId: string;
  isAuthor: boolean;
  canAccept: boolean;
};

export function ReplyActions({
  requestId,
  replyId,
  isAuthor,
  canAccept,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'accept' | 'reject' | null>(
    null,
  );

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
              onClick={() =>
                run(() =>
                  confirming === 'accept'
                    ? acceptReplyAction(requestId, replyId)
                    : rejectReplyAction(requestId, replyId),
                )
              }
              disabled={pending}
              className={`flex-1 text-white font-bold text-sm py-2 rounded-lg disabled:opacity-50 ${
                confirming === 'accept'
                  ? 'bg-primary'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {pending
                ? confirming === 'accept'
                  ? 'Accepting…'
                  : 'Rejecting…'
                : confirming === 'accept'
                  ? 'Confirm accept'
                  : 'Confirm reject'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className="px-3 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {canAccept && (
              <button
                type="button"
                onClick={() => setConfirming('accept')}
                className="flex-1 border border-primary text-primary font-bold text-sm py-2 rounded-lg hover:bg-primary/5 transition"
              >
                Accept
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirming('reject')}
              className="flex-1 border border-red-200 text-red-700 font-bold text-sm py-2 rounded-lg hover:bg-red-50 transition"
            >
              Reject
            </button>
          </div>
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