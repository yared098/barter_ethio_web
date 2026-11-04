'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './image-picker';

type Category = { id: string; name: string; icon: string | null };

export function CreateRequestForm() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'BUY' | 'BARTER' | 'EITHER'>('BUY');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [locationName, setLocationName] = useState('');
  const [images, setImages] = useState<File[]>([]);

  // ⭐ Location restriction
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationRestricted, setLocationRestricted] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  // ── Capture current location ──
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationRestricted(true);
        setLocating(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const clearLocation = () => {
    setLatitude(null);
    setLongitude(null);
    setLocationRestricted(false);
  };

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

    const min = budgetMin ? parseFloat(budgetMin) : undefined;
    const max = budgetMax ? parseFloat(budgetMax) : undefined;
    if (min != null && max != null && min > max) {
      setError('Minimum budget cannot exceed maximum');
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('title', title.trim());
      body.append('description', description.trim());
      body.append('categoryId', categoryId);
      body.append('type', type);
      if (min != null) body.append('budgetMin', String(min));
      if (max != null) body.append('budgetMax', String(max));
      if (locationName.trim()) body.append('location', locationName.trim());
      if (locationRestricted && latitude != null) {
        body.append('latitude', String(latitude));
        body.append('longitude', String(longitude));
        body.append('isLocationRestricted', 'true');
      }
      for (const image of images) {
        body.append('images', image, image.name);
      }

      const res = await fetch('/api/proxy/requests', {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (Array.isArray(err?.message)
            ? err.message.join(', ')
            : err?.message?.toString?.()) ||
          'Could not post request';
        throw new Error(msg);
      }

      const created = await res.json();
      router.push(`/browse/${created.id}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
          What do you need? *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. iPhone 12, 128GB"
          className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary transition"
          maxLength={120}
          disabled={submitting}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">Details *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Condition, specs, what you'll accept..."
          rows={5}
          className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary transition resize-y"
          maxLength={2000}
          disabled={submitting}
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">
          Photos (optional)
        </label>
        <ImagePicker images={images} onChange={setImages} maxImages={5} />
        {submitting && images.length > 0 && (
          <p className="text-xs text-primary mt-2">
            Uploading {images.length} photo(s) with your request…
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">Category *</label>
        {loadingCats ? (
          <div className="text-sm text-ink-muted">Loading categories…</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  disabled={submitting}
                  className={`px-3 py-2 rounded-full text-sm font-bold transition ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {c.icon ? `${c.icon} ` : ''}
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">Payment</label>
        <div className="flex gap-2">
          {(['BUY', 'BARTER', 'EITHER'] as const).map((t) => {
            const active = type === t;
            const labels = { BUY: '💵 Cash', BARTER: '🔄 Barter', EITHER: '🔀 Either' };
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                disabled={submitting}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-ink mb-2">
            Min budget (ETB)
          </label>
          <input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="0"
            min={0}
            step={1}
            disabled={submitting}
            className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-ink mb-2">
            Max budget (ETB)
          </label>
          <input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="—"
            min={0}
            step={1}
            disabled={submitting}
            className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-bold text-ink mb-2">
          Location (optional)
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Addis Ababa, Bole"
          disabled={submitting}
          className="w-full border border-border rounded-xl px-4 py-3 text-ink outline-none focus:border-primary mb-2"
          maxLength={120}
        />

        {/* GPS capture */}
        {latitude == null ? (
          <button
            type="button"
            onClick={captureLocation}
            disabled={locating || submitting}
            className="w-full border-2 border-dashed border-border rounded-xl py-3 text-sm font-bold text-primary hover:border-primary hover:bg-primary-light/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>📍</span>
            {locating ? 'Getting your location…' : 'Use my current location'}
          </button>
        ) : (
          <div className="bg-primary-light/40 border border-primary/30 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <div className="font-bold text-primary">
                  📍 Location captured
                </div>
                <div className="text-ink-muted mt-0.5">
                  {latitude.toFixed(4)}, {longitude?.toFixed(4)}
                </div>
              </div>
              <button
                type="button"
                onClick={clearLocation}
                className="text-xs font-bold text-primary hover:underline"
              >
                Change
              </button>
            </div>

            {/* Restriction toggle */}
            <label className="flex items-start gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={locationRestricted}
                onChange={(e) => setLocationRestricted(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-ink">
                  Only allow replies from nearby
                </div>
                <div className="text-[10px] text-ink-muted leading-relaxed">
                  People more than 50 km away will not be able to reply.
                  Perfect for pickup-only items.
                </div>
              </div>
            </label>
          </div>
        )}

        <p className="text-[10px] text-ink-muted mt-2">
          Note: you can never reply to your own request — that&apos;s enforced
          by the server.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-full transition disabled:opacity-60"
      >
        {submitting ? 'Posting…' : 'Post request'}
      </button>
    </form>
  );
}