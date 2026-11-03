'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ChatOffer } from '@/lib/chat';
import { otherParty } from '@/lib/chat';
import { ChatListItem } from './chat-list-item';

type Props = {
  incoming: ChatOffer[];
  outgoing: ChatOffer[];
  meId: string;
};

export function ChatList({ incoming, outgoing, meId }: Props) {
  const [search, setSearch] = useState('');

  // Merge both into one list, newest activity on top
  const merged = useMemo(() => {
    const all = [...incoming, ...outgoing];
    const seen = new Set<string>();
    const unique = all.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    unique.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return unique;
  }, [incoming, outgoing]);

  // Search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return merged;

    return merged.filter((o) => {
      const other = otherParty(o, meId);
      const name = (other.name ?? '').toLowerCase();
      const product = (
        o.offeredProduct?.title ??
        o.requestedProduct?.title ??
        ''
      ).toLowerCase();
      const msg = (o.message ?? '').toLowerCase();
      return name.includes(q) || product.includes(q) || msg.includes(q);
    });
  }, [merged, search, meId]);

  // Empty state
  if (merged.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-bold text-ink mb-2">No messages yet</h2>
        <p className="text-sm text-ink-muted max-w-sm mx-auto mb-6 leading-relaxed">
          When you send or receive a barter offer, the conversation appears
          here.
        </p>
        <Link
          href="/browse"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full transition"
        >
          Browse the board
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Sticky header with search + count */}
      <div className="sticky top-14 z-20 bg-white px-3 py-2 border-b border-divider">
        <div className="relative mb-2">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition placeholder:text-ink-subtle"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              aria-label="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-1">
          <span className="text-[11px] font-semibold text-ink-muted">
            {search
              ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
              : `${merged.length} conversation${merged.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      {/* One merged list — no tabs */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-6 text-ink-muted">
          <p className="text-sm">No chats matching “{search}”</p>
        </div>
      ) : (
        <div>
          {filtered.map((offer) => (
            <ChatListItem
              key={offer.id}
              offer={offer}
              meId={meId}
            />
          ))}
        </div>
      )}
    </div>
  );
}