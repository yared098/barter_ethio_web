'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  otherParty,
  subjectProduct,
  statusLabel,
  type ChatOffer,
  type ChatMessage,
} from '@/lib/chat';
import { UserAvatar } from './user-avatar';
import { MessageBubble } from './message-bubble';
import { resolveImage } from '@/lib/utils';

type Props = {
  initialOffer: ChatOffer;
  meId: string;
};

/** "Today" / "Yesterday" / "Monday" / "Oct 15" */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type ThreadItem =
  | { kind: 'date'; key: string; label: string }
  | {
      kind: 'msg';
      key: string;
      message: ChatMessage;
      isMine: boolean;
      showAvatar: boolean;
      isLastInGroup: boolean;
    };

const STATUS_TONE: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    label: 'Pending',
  },
  ACCEPTED: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    label: 'Active deal',
  },
  COMPLETED: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    label: 'Completed',
  },
  DECLINED: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    label: 'Declined',
  },
  CANCELLED: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    label: 'Cancelled',
  },
};

export function ChatDetail({ initialOffer, meId }: Props) {
  const router = useRouter();
  const [offer, setOffer] = useState<ChatOffer>(initialOffer);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialOffer.messages ?? [],
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScroll = useRef(true);

  const other = otherParty(offer, meId);
  const product = subjectProduct(offer, meId);
  const productImage = resolveImage(product?.images?.[0]);
  const canMessage = !['COMPLETED', 'CANCELLED', 'DECLINED'].includes(
    offer.status,
  );
  const isReceiver = offer.receiverId === meId;
  const isSender = offer.senderId === meId;

  const subtitle =
    offer.status === 'PENDING'
      ? isReceiver
        ? 'Awaiting your response'
        : 'Waiting for their response'
      : offer.status === 'ACCEPTED'
        ? 'Active deal'
        : offer.status === 'COMPLETED'
          ? 'Deal completed'
          : statusLabel(offer.status);

  const statusTone =
    STATUS_TONE[offer.status] ?? STATUS_TONE.PENDING;

  // ═════ Build the thread (date separators + grouping) ═════
  const thread: ThreadItem[] = useMemo(() => {
    const items: ThreadItem[] = [];
    let lastDay = '';

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const day = dayLabel(m.createdAt);

      if (day !== lastDay) {
        items.push({ kind: 'date', key: `date-${day}-${i}`, label: day });
        lastDay = day;
      }

      const isMine = m.senderId === meId;
      const next = i < messages.length - 1 ? messages[i + 1] : null;
      const nextSameSender =
        !!next &&
        next.senderId === m.senderId &&
        dayLabel(next.createdAt) === day;

      const isLastInGroup = !nextSameSender;
      const showAvatar = isLastInGroup && !isMine;

      items.push({
        kind: 'msg',
        key: m.id,
        message: m,
        isMine,
        showAvatar,
        isLastInGroup,
      });
    }
    return items;
  }, [messages, meId]);

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    shouldAutoScroll.current = distFromBottom < 120;
    setShowScrollBtn(distFromBottom > 400);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
    shouldAutoScroll.current = true;
    setShowScrollBtn(false);
  };

  // ── Poll for new messages + status changes ──
  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    const poll = async () => {
      if (!active) return;
      if (document.visibilityState !== 'visible') {
        scheduleNext();
        return;
      }
      try {
        const res = await fetch(`/api/proxy/offers/${offer.id}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const fresh = (await res.json()) as ChatOffer;
          if (!active) return;
          setOffer(fresh);
          if (fresh.messages) {
            const changed =
              fresh.messages.length !== messages.length ||
              fresh.messages[fresh.messages.length - 1]?.id !==
                messages[messages.length - 1]?.id;
            if (changed) setMessages(fresh.messages);
          }
        }
      } catch {}
      scheduleNext();
    };

    const scheduleNext = () => {
      if (!active) return;
      timer = window.setTimeout(poll, 3000);
    };

    scheduleNext();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  // ── Send message ──
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      offerId: offer.id,
      senderId: meId,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: meId, name: 'You', image: null },
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    shouldAutoScroll.current = true;

    try {
      const res = await fetch(`/api/proxy/offers/${offer.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message?.toString?.() ||
          err?.message?.[0] ||
          'Could not send message';
        throw new Error(msg);
      }
      const real = (await res.json()) as ChatMessage;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
      inputRef.current?.focus();
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Offer actions ──
  const performAction = async (
    action: 'accept' | 'decline' | 'cancel' | 'complete',
  ) => {
    if (acting) return;
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message?.toString?.() ||
          err?.message?.[0] ||
          'Action failed';
        throw new Error(msg);
      }
      const fresh = await fetch(`/api/proxy/offers/${offer.id}`, {
        cache: 'no-store',
      });
      if (fresh.ok) {
        const updated = (await fresh.json()) as ChatOffer;
        setOffer(updated);
        if (updated.messages) setMessages(updated.messages);
      }
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-slate-50 to-slate-100">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-3xl mx-auto px-2 sm:px-3 h-16 flex items-center gap-2.5">
          <Link
            href="/chat"
            className="flex items-center justify-center w-9 h-9 rounded-full text-slate-600 hover:bg-slate-100 hover:text-primary transition flex-shrink-0"
            aria-label="Back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="relative flex-shrink-0">
            <UserAvatar name={other.name} image={other.image} size={40} />
            {offer.status === 'ACCEPTED' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-slate-900 leading-tight truncate">
              {other.name || 'Barter User'}
            </div>
            <div className="text-[11px] text-slate-500 truncate font-medium">
              {subtitle}
            </div>
          </div>

          <Link
            href={product ? `/product/${product.id}` : '/browse'}
            className="flex items-center justify-center w-9 h-9 rounded-full text-slate-600 hover:bg-slate-100 hover:text-primary transition flex-shrink-0"
            aria-label="Deal info"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </Link>
        </div>

        {/* Product context strip — card style */}
        {product && (
          <Link
            href={`/product/${product.id}`}
            className="block border-t border-slate-200/60 hover:bg-slate-50/80 transition"
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
              {productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productImage}
                  alt={product.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-base">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-slate-900 truncate">
                  {product.title}
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                  {product.estimatedValue?.toLocaleString()} ETB
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusTone.bg} ${statusTone.text}`}
              >
                {statusTone.label}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-400 flex-shrink-0"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        )}
      </header>

      {/* ═══════════ MESSAGES ═══════════ */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-6">
          {/* Empty state — show original offer message */}
          {thread.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex flex-col items-center gap-3 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  💬
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  No messages yet
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Start the conversation below. Introduce yourself or ask a
                  question about the deal.
                </p>
              </div>
            </div>
          )}

          {thread.map((item) =>
            item.kind === 'date' ? (
              <div key={item.key} className="flex justify-center my-4">
                <span className="text-[10.5px] font-bold text-slate-500 bg-white/90 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                  {item.label}
                </span>
              </div>
            ) : (
              <MessageBubble
                key={item.key}
                message={item.message}
                isMine={item.isMine}
                showAvatar={item.showAvatar}
                isLastInGroup={item.isLastInGroup}
              />
            ),
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 right-4 w-11 h-11 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:shadow-xl transition z-20 animate-in fade-in slide-in-from-bottom-2 duration-200"
            aria-label="Scroll to bottom"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* ═══════════ ACTION BANNERS ═══════════ */}
      {offer.status === 'PENDING' && isReceiver && (
        <div className="border-t border-slate-200/80 bg-white px-3 py-3 safe-bottom">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-900">
                  New barter offer
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Accept to start the exchange, or decline to pass.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => performAction('decline')}
                disabled={acting}
                className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-full text-[13px] hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Decline
              </button>
              <button
                onClick={() => performAction('accept')}
                disabled={acting}
                className="flex-1 bg-primary text-white font-bold py-2.5 rounded-full text-[13px] hover:bg-primary-dark shadow-sm hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                {acting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Accepting…
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Accept offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {offer.status === 'PENDING' && isSender && (
        <div className="border-t border-slate-200/80 bg-white px-3 py-3 safe-bottom">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-900">
                  Offer pending
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Waiting for {other.name || 'the receiver'} to respond.
                </p>
              </div>
            </div>
            <button
              onClick={() => performAction('cancel')}
              disabled={acting}
              className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-2.5 rounded-full text-[13px] hover:border-red-300 hover:text-red-600 hover:bg-red-50/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {acting ? 'Cancelling…' : 'Cancel offer'}
            </button>
          </div>
        </div>
      )}

      {offer.status === 'ACCEPTED' && (
        <div className="border-t border-slate-200/80 bg-white px-3 py-3 safe-bottom">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-900">
                  Deal in progress
                </p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Coordinate the exchange in chat. Mark complete when done.
                </p>
              </div>
            </div>
            <button
              onClick={() => performAction('complete')}
              disabled={acting}
              className="w-full bg-primary text-white font-bold py-2.5 rounded-full text-[13px] hover:bg-primary-dark shadow-sm hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              {acting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Mark as completed
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ ERROR ═══════════ */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-3 py-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600 flex-shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span className="text-xs text-red-800 flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-red-800 hover:underline flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ INPUT BAR ═══════════ */}
      {canMessage ? (
        <div className="border-t border-slate-200/80 bg-white safe-bottom">
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto px-2 sm:px-3 py-2 flex items-end gap-1.5"
          >
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-primary transition flex-shrink-0"
              aria-label="Attachments"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <div className="flex-1 bg-slate-100/80 rounded-2xl border border-transparent focus-within:border-primary/40 focus-within:bg-white transition">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message…"
                rows={1}
                className="w-full bg-transparent px-4 py-2.5 text-[14px] text-slate-900 outline-none resize-none max-h-32 placeholder:text-slate-400 leading-snug"
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                text.trim() && !sending
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg active:scale-95'
                  : 'bg-slate-100 text-slate-400'
              }`}
              aria-label="Send"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-slate-200/80 bg-white px-4 py-4 safe-bottom text-center">
          <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            This conversation is {statusLabel(offer.status).toLowerCase()} — no
            new messages
          </p>
        </div>
      )}
    </div>
  );
}