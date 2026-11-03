'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  condition: string;
};

export function OfferForm({
  requestedProductId,
  requestedProductTitle,
}: {
  requestedProductId: string;
  requestedProductTitle: string;
}) {
  const router = useRouter();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [offeredProductId, setOfferedProductId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/proxy/products?mine=true');
        if (!res.ok) throw new Error('Could not load your products');
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        // only AVAILABLE products can be offered
        const available = list.filter((p: any) => p.status === 'AVAILABLE');
        setMyProducts(available);
      } catch (e: any) {
        setError(e?.message || 'Could not load your products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeredProductId) {
      setError('Please pick one of your products to offer');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offeredProductId,
          requestedProductId,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message?.toString?.() ||
          err?.message?.[0] ||
          'Failed to send offer';
        throw new Error(msg);
      }

      const offer = await res.json();
      setDone(true);
      router.push(`/chat/${offer.id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-ink-muted">Loading your products…</div>;
  }

  if (myProducts.length === 0) {
    return (
      <div className="bg-primary-light/40 rounded-xl p-4 text-sm">
        <p className="text-ink-muted mb-3">
          You don&apos;t have any available products to offer. List one first,
          then come back.
        </p>
        <a
          href="/product/new"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-full text-xs transition"
        >
          List a product
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
        ✅ Offer sent — redirecting to chat…
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-ink mb-2">
          Pick one of your products to offer for &quot;{requestedProductTitle}&quot; *
        </label>
        <div className="space-y-2">
          {myProducts.map((p) => {
            const active = offeredProductId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setOfferedProductId(p.id)}
                disabled={submitting}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border transition text-left ${
                  active
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">
                    {p.title}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {p.estimatedValue?.toLocaleString()} ETB · {p.condition}
                  </div>
                </div>
                {active && (
                  <span className="text-primary text-lg">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink mb-2">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Add a note about your offer…"
          disabled={submitting}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-y"
          maxLength={500}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !offeredProductId}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-full text-sm transition disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send offer'}
      </button>
    </form>
  );
}