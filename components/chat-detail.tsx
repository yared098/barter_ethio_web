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

  // ═════ Build the thread (date separators + grouping) ═════
  const thread: ThreadItem[] = useMemo(() => {
    const items: ThreadItem[] = [];
    let lastDay = '';
    let lastSender = '';

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const day = dayLabel(m.createdAt);

      if (day !== lastDay) {
        items.push({ kind: 'date', key: `date-${day}-${i}`, label: day });
        lastDay = day;
        lastSender = '';
      }

      const isMine = m.senderId === meId;
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;

      const senderChanged = !prev || prev.senderId !== m.senderId;
      const nextSameSender =
        !!next &&
        next.senderId === m.senderId &&
        dayLabel(next.createdAt) === day;

      // avatar shows on the last message of a received group
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

      lastSender = m.senderId;
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
    <div className="flex flex-col h-screen bg-[#efeae2]">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-3 h-14 flex items-center gap-3">
          <Link
            href="/chat"
            className="text-ink-muted hover:text-primary transition p-1 -ml-1 flex-shrink-0"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          <UserAvatar name={other.name} image={other.image} size={36} />

          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-ink leading-tight truncate">
              {other.name || 'Barter User'}
            </div>
            <div className="text-[11px] text-ink-muted truncate">
              {subtitle}
            </div>
          </div>

          <Link
            href={product ? `/product/${product.id}` : '/browse'}
            className="text-ink-muted hover:text-primary transition p-1 flex-shrink-0"
            aria-label="Deal info"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Link>
        </div>

        {/* Product context strip */}
        {product && (
          <Link
            href={`/product/${product.id}`}
            className="block bg-primary-light/50 hover:bg-primary-light/70 transition border-b border-primary/10"
          >
            <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-3">
              {product.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center flex-shrink-0 text-sm">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-ink truncate">
                  {product.title}
                </div>
                <div className="text-[10px] text-primary font-semibold">
                  {product.estimatedValue?.toLocaleString()} ETB · {statusLabel(offer.status)}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
                <path strokeLinecap="round" d="M9 18l6-6-6-6" />
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
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(0,168,107,0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0,168,107,0.03) 0%, transparent 50%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-3 py-3">
          {thread.length === 0 && (
            <div className="text-center py-10">
              <div className="inline-block bg-white rounded-2xl border border-border px-4 py-3 max-w-sm">
                <div className="text-[10px] font-bold text-primary mb-1">
                  {offer.sender.name || 'Sender'}
                </div>
                <div className="text-[13px] text-ink">
                  {offer.message || 'Start the conversation below.'}
                </div>
              </div>
            </div>
          )}

          {thread.map((item) =>
            item.kind === 'date' ? (
              <div key={item.key} className="flex justify-center my-3">
                <span className="text-[10px] font-bold text-ink-muted bg-white/90 px-3 py-1 rounded-full shadow-sm">
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
            className="fixed bottom-32 right-4 w-10 h-10 rounded-full bg-white shadow-lg border border-border flex items-center justify-center hover:bg-primary-light transition z-20"
            aria-label="Scroll to bottom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* ═══════════ ACTION BANNER ═══════════ */}
      {offer.status === 'PENDING' && isReceiver && (
        <div className="border-t border-border bg-white px-3 py-2">
          <div className="max-w-3xl mx-auto flex gap-2">
            <button
              onClick={() => performAction('decline')}
              disabled={acting}
              className="flex-1 bg-white border border-border text-ink font-bold py-2.5 rounded-full text-sm hover:border-red-300 hover:text-red-600 transition disabled:opacity-60"
            >
              Decline
            </button>
            <button
              onClick={() => performAction('accept')}
              disabled={acting}
              className="flex-1 bg-primary text-white font-bold py-2.5 rounded-full text-sm hover:bg-primary-dark transition disabled:opacity-60"
            >
              {acting ? 'Processing…' : 'Accept offer'}
            </button>
          </div>
        </div>
      )}

      {offer.status === 'PENDING' && isSender && (
        <div className="border-t border-border bg-white px-3 py-2">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => performAction('cancel')}
              disabled={acting}
              className="w-full bg-white border border-border text-ink font-bold py-2.5 rounded-full text-sm hover:border-red-300 hover:text-red-600 transition disabled:opacity-60"
            >
              {acting ? 'Cancelling…' : 'Cancel offer'}
            </button>
          </div>
        </div>
      )}

      {offer.status === 'ACCEPTED' && (
        <div className="border-t border-border bg-white px-3 py-2">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => performAction('complete')}
              disabled={acting}
              className="w-full bg-primary text-white font-bold py-2.5 rounded-full text-sm hover:bg-primary-dark transition disabled:opacity-60"
            >
              {acting ? 'Confirming…' : 'Mark as completed'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ ERROR ═══════════ */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-3 py-2">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <span className="text-xs text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-red-800 underline flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ INPUT BAR (Telegram-style) ═══════════ */}
      {canMessage ? (
        <div className="border-t border-border bg-white">
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto px-2 py-2 flex items-end gap-2"
          >
            <button
              type="button"
              className="text-ink-muted hover:text-primary transition p-2 flex-shrink-0"
              aria-label="Attachments"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <div className="flex-1 bg-[#f0f5f2] rounded-2xl flex items-end">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message"
                rows={1}
                className="flex-1 bg-transparent px-4 py-2.5 text-[14px] text-ink outline-none resize-none max-h-32 placeholder:text-ink-subtle"
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              disabled={!text.trim() || sending}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                text.trim() && !sending
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-md'
                  : 'bg-[#f0f5f2] text-ink-subtle'
              }`}
              aria-label="Send"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-border bg-white px-3 py-3 text-center">
          <p className="text-xs text-ink-muted">
            This conversation is {statusLabel(offer.status).toLowerCase()} — no
            new messages
          </p>
        </div>
      )}
    </div>
  );
}