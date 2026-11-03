'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadImages } from '@/lib/upload';
import { ImagePicker } from './image-picker';

type Category = { id: string; name: string; icon: string | null };
type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

const CONDITION_LABELS: Record<Condition, string> = {
  NEW: '✨ New',
  LIKE_NEW: '⭐ Like new',
  GOOD: '👍 Good',
  FAIR: '👌 Fair',
};

type Want = { categoryId: string; keywords: string };

export function CreateProductForm() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<Condition>('GOOD');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [wants, setWants] = useState<Want[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/proxy/categories');
        if (!res.ok) throw new Error('Could not load categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || 'Could not load categories');
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!categoryId) {
      setError('Please pick a category');
      return;
    }
    const value = parseFloat(estimatedValue);
    if (isNaN(value) || value < 0) {
      setError('Estimated value must be a positive number');
      return;
    }

    // wants: categoryId required for each
    const cleanWants = wants.filter(
      (w) => w.categoryId && categories.some((c) => c.id === w.categoryId),
    );
    if (cleanWants.length === 0) {
      setError('Pick at least one category you want to trade for');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setUploadProgress(`Uploading ${images.length} image(s)…`);
        imageUrls = await uploadImages(images, (done, total) => {
          setUploadProgress(`Uploading ${done}/${total}…`);
        });
        setUploadProgress('');
      }

      const body: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        condition,
        estimatedValue: value,
        wants: cleanWants.map((w) => ({
          categoryId: w.categoryId,
          keywords: w.keywords.trim() || undefined,
        })),
      };
      if (imageUrls.length > 0) body.images = imageUrls;

      const res = await fetch('/api/proxy/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message?.toString?.() ||
          err?.message?.[0] ||
          'Could not create product';
        throw new Error(msg);
      }

      const created = await res.json();
      router.push(`/product/${created.id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">
          What are you offering? *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sony WH-1000XM5 headphones"
          disabled={submitting}
          className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary"
          maxLength={120}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">Details *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Condition, age, any issues..."
          rows={4}
          disabled={submitting}
          className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary resize-y"
          maxLength={2000}
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">
          Photos (optional)
        </label>
        <ImagePicker images={images} onChange={setImages} maxImages={5} />
        {uploadProgress && (
          <p className="text-xs text-primary mt-2">{uploadProgress}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">
          Category *
        </label>
        {loadingCats ? (
          <div className="text-sm text-ink-muted">Loading…</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                disabled={submitting}
                className={`px-3 py-2 rounded-full text-sm font-bold transition ${
                  categoryId === c.id
                    ? 'bg-primary text-white'
                    : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {c.icon ? `${c.icon} ` : ''}
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">Condition</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(CONDITION_LABELS) as Condition[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCondition(c)}
              disabled={submitting}
              className={`px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                condition === c
                  ? 'bg-primary text-white'
                  : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
              }`}
            >
              {CONDITION_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated value */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">
          Estimated value (ETB) *
        </label>
        <input
          type="number"
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
          placeholder="e.g. 3500"
          min={0}
          step={1}
          disabled={submitting}
          className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary"
        />
      </div>

      {/* Wants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold text-ink">
            What you want in return *
          </label>
          <button
            type="button"
            onClick={() => setWants([...wants, { categoryId: '', keywords: '' }])}
            disabled={submitting}
            className="text-xs font-bold text-primary hover:underline"
          >
            + Add
          </button>
        </div>

        {wants.length === 0 && (
          <div className="text-sm text-ink-muted py-3">
            Add at least one category you&apos;d trade for.
          </div>
        )}

        {wants.map((w, i) => (
          <div
            key={i}
            className="bg-primary-light/30 rounded-xl p-3 mb-2 space-y-2"
          >
            <div className="flex gap-2">
              <select
                value={w.categoryId}
                onChange={(e) => {
                  const next = [...wants];
                  next[i] = { ...next[i], categoryId: e.target.value };
                  setWants(next);
                }}
                disabled={submitting}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Pick category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setWants(wants.filter((_, idx) => idx !== i))}
                disabled={submitting}
                className="px-2 text-ink-muted hover:text-red-600 text-lg"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
            <input
              type="text"
              value={w.keywords}
              onChange={(e) => {
                const next = [...wants];
                next[i] = { ...next[i], keywords: e.target.value };
                setWants(next);
              }}
              disabled={submitting}
              placeholder="Optional keywords (e.g. 'iPhone')"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-full transition disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Publish product'}
      </button>
    </form>
  );
}