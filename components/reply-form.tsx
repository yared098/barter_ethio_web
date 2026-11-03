'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReplyForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError('Message is required'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/requests/${requestId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          offeredPrice: offeredPrice ? parseFloat(offeredPrice) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.message?.toString?.() || err?.message?.[0] || 'Failed to reply';
        throw new Error(msg);
      }

      setDone(true);
      setMessage('');
      setOfferedPrice('');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
        ✅ Reply sent. The author will be notified.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-bold text-ink mb-1">
          Your message *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Describe what you can offer…"
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-y"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink mb-1">
          Your price (ETB, optional)
        </label>
        <input
          type="number"
          value={offeredPrice}
          onChange={(e) => setOfferedPrice(e.target.value)}
          placeholder="e.g. 2500"
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-full text-sm transition disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send reply'}
      </button>
    </form>
  );
}