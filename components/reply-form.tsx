'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  requestId: string;
  restricted: boolean;
  requestLatitude: number | null;
  requestLongitude: number | null;
};

const MAX_REPLY_DISTANCE_KM = 50;

function distanceInKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(latitude2 - latitude1);
  const longitudeDelta = radians(longitude2 - longitude1);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitude1)) *
      Math.cos(radians(latitude2)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getReplyErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'number' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return `Could not get your location: ${error.message}`;
  }
  return error instanceof Error ? error.message : 'Failed to reply';
}

export function ReplyForm({
  requestId,
  restricted,
  requestLatitude,
  requestLongitude,
}: Props) {
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
      let viewerLat: number | undefined;
      let viewerLng: number | undefined;
      if (restricted) {
        if (
          requestLatitude == null ||
          requestLongitude == null ||
          !Number.isFinite(requestLatitude) ||
          !Number.isFinite(requestLongitude)
        ) {
          throw new Error(
            'This request has no valid location for distance checks.',
          );
        }
        if (!navigator.geolocation) {
          throw new Error('Your browser does not support location sharing.');
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 60000,
            });
          },
        );
        viewerLat = position.coords.latitude;
        viewerLng = position.coords.longitude;

        const distance = distanceInKm(
          requestLatitude,
          requestLongitude,
          viewerLat,
          viewerLng,
        );
        if (distance > MAX_REPLY_DISTANCE_KM) {
          throw new Error(
            'You are more than 50 km from this request, so you cannot reply.',
          );
        }
      }

      const res = await fetch(`/api/proxy/requests/${requestId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          offeredPrice: offeredPrice ? parseFloat(offeredPrice) : undefined,
          ...(restricted && { viewerLat, viewerLng }),
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
    } catch (e: unknown) {
      setError(getReplyErrorMessage(e));
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
      {restricted && (
        <p className="rounded-xl border border-primary/20 bg-primary-light/50 p-3 text-xs text-ink-muted">
          This request is limited to people within 50 km. Share your current
          location to check your distance; your coordinates will be sent with
          your reply.
        </p>
      )}
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
        {submitting
          ? restricted
            ? 'Checking location and sending…'
            : 'Sending…'
          : restricted
            ? 'Share location & send reply'
            : 'Send reply'}
      </button>
    </form>
  );
}