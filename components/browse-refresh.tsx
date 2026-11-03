'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function BrowseRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    pullDistanceRef.current = 0;
    setPullDistance(0);
    startTransition(() => router.refresh());
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (window.scrollY === 0 && !isPending) {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    } else {
      touchStartY.current = null;
    }
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (touchStartY.current == null || isPending) return;
    const distance = event.touches[0]?.clientY - touchStartY.current;
    if (distance > 0) {
      const nextDistance = Math.min(distance, 96);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }

  function handleTouchEnd() {
    touchStartY.current = null;
    if (pullDistanceRef.current >= 64) {
      refresh();
    } else {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    }
  }

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-w-0"
    >
      <div
        aria-live="polite"
        className="flex items-center justify-center overflow-hidden text-xs font-semibold text-emerald-700 transition-[height] duration-200"
        style={{ height: pullDistance > 0 || isPending ? 40 : 0 }}
      >
        <span className="inline-flex items-center gap-2">
          <svg
            className={isPending ? 'animate-spin' : ''}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M5.6 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.4 15" />
          </svg>
          {isPending
            ? 'Loading latest requests…'
            : pullDistance >= 64
              ? 'Release to refresh'
              : 'Pull down to refresh'}
        </span>
      </div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={refresh}
          disabled={isPending}
          aria-label="Refresh requests"
          className="mt-1 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-xs font-bold text-ink-muted transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          <svg
            className={isPending ? 'animate-spin' : ''}
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M5.6 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.4 15" />
          </svg>
          <span className="hidden sm:inline">
            {isPending ? 'Refreshing' : 'Refresh'}
          </span>
        </button>
      </div>
      {children}
    </section>
  );
}
