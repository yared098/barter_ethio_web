'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateProductAction } from '@/app/products/actions';

type Category = { id: string; name: string; icon: string | null; slug: string };

type Product = {
  id: string;
  title: string;
  description: string;
  condition: string;
  estimatedValue: number;
  categoryId: string;
};

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
] as const;

export function EditProductForm({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [condition, setCondition] = useState(product.condition);
  const [estimatedValue, setEstimatedValue] = useState(
    String(product.estimatedValue ?? ''),
  );
  const [categoryId, setCategoryId] = useState(product.categoryId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const value = Number(estimatedValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Estimated value must be greater than 0');
      return;
    }

    startTransition(async () => {
      try {
        await updateProductAction(product.id, {
          title: title.trim(),
          description: description.trim(),
          condition: condition as any,
          estimatedValue: value,
          categoryId,
        });
        router.push('/products');
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not save changes');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          maxLength={120}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition disabled:opacity-60"
          placeholder="e.g. Samsung Galaxy A54"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          {title.length}/120
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
          rows={4}
          maxLength={2000}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none disabled:opacity-60"
          placeholder="Describe the item — what makes it special, any wear, what's included…"
        />
      </div>

      {/* Category + Condition — two columns */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={pending}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition disabled:opacity-60"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Condition
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            disabled={pending}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition disabled:opacity-60"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estimated value */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Estimated value (ETB)
        </label>
        <div className="relative">
          <input
            type="number"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            disabled={pending}
            min={1}
            step={1}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-16 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition disabled:opacity-60 tabular-nums"
            placeholder="0"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            ETB
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-600 shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Link
          href="/products"
          className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
        >
          {pending ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}