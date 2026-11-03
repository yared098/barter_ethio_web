'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteProductAction } from '@/app/products/actions';
import type { MyProduct } from '@/lib/products';
import { resolveImage } from '@/lib/utils';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  AVAILABLE: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    label: 'Available',
  },
  PENDING: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    label: 'In a deal',
  },
  SWAPPED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    label: 'Swapped',
  },
};

export function MyProductCard({ product }: { product: MyProduct }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditOrDelete = product.status === 'AVAILABLE';
  const style = STATUS_STYLE[product.status] ?? STATUS_STYLE.AVAILABLE;
  const image = resolveImage(product.images?.[0]);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteProductAction(product.id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not delete');
        setConfirming(false);
      }
    });
  }

  function cancelConfirm() {
    setConfirming(false);
    setError(null);
  }

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition">
      <Link
        href={`/product/${product.id}`}
        className="block"
        title={`View ${product.title}`}
      >
        <div className="aspect-square bg-slate-100 relative overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              📦
            </div>
          )}
          <span
            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>

        </div>
      </Link>

      <div className="p-4">
        <Link
          href={`/product/${product.id}`}
          className="block font-bold text-slate-900 text-sm truncate hover:text-primary transition mb-1"
        >
          {product.title}
        </Link>

        <div className="text-[11px] text-slate-500 mb-2 truncate">
          {product.category?.icon || '📦'} {product.category?.name || '—'}
        </div>

        <div className="text-sm font-black text-primary tabular-nums mb-3">
          {product.estimatedValue?.toLocaleString()} ETB
        </div>

        {product.wants && product.wants.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.wants.slice(0, 3).map((w) => (
              <span
                key={w.categoryId}
                className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              >
                {w.category?.icon || ''} {w.category?.name || 'want'}
              </span>
            ))}
            {product.wants.length > 3 && (
              <span className="text-[10px] text-slate-500 px-1.5 py-0.5">
                +{product.wants.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {confirming ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-red-700 bg-red-50 rounded-lg px-2 py-1.5">
              Delete this product permanently?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-lg transition disabled:opacity-60"
              >
                {pending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={cancelConfirm}
                disabled={pending}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <Link
              href={`/product/${product.id}`}
              className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition"
            >
              View
            </Link>

            {canEditOrDelete ? (
              <>
                <Link
                  href={`/product/${product.id}/edit`}
                  className="flex-1 text-center bg-primary-dark hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  aria-label="Delete"
                  className="w-8 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs py-2 rounded-lg transition flex items-center justify-center"
                >
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
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                  </svg>
                </button>
              </>
            ) : (
              <span
                title="Can't edit — product is in a pending deal"
                className="flex-1 text-center bg-slate-50 text-slate-400 font-bold text-xs py-2 rounded-lg cursor-not-allowed"
              >
                Edit
              </span>
            )}
          </div>
        )}

        {error && <p className="text-[11px] text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}