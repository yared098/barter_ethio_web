'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getBrowseRequests } from '@/app/browse/actions';
import type { Request, RequestList } from '@/lib/api';
import { RequestCard } from '@/components/request-card';

type Props = {
  initialData: RequestList | null;
  initialError: string | null;
  initialPage: number;
  categoryId?: string;
  currentUserId?: string;
};

type Coordinates = { latitude: number; longitude: number };

function getLocationError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'number'
  ) {
    if (error.code === 1) {
      return 'Location permission was denied. You can still browse all requests.';
    }
    if (error.code === 2) {
      return 'Your location could not be determined. You can still browse all requests.';
    }
    if (error.code === 3) {
      return 'Location lookup timed out. Please try again.';
    }
  }
  return error instanceof Error
    ? error.message
    : 'Could not load requests near you.';
}

function getCurrentCoordinates() {
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error('Location sharing is not supported by this browser.'),
    );
  }

  return new Promise<Coordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export function BrowseRequests({
  initialData,
  initialError,
  initialPage,
  categoryId,
  currentUserId,
}: Props) {
  const [nearbyData, setNearbyData] = useState<RequestList | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNearby(nextPage = 1) {
    setIsLoading(true);
    setError(null);
    try {
      const location = await getCurrentCoordinates();
      const nearbyData = await getBrowseRequests({
        page: nextPage,
        categoryId,
        ...location,
      });
      setCoordinates(location);
      setNearbyData(nearbyData);
    } catch (reason: unknown) {
      setError(getLocationError(reason));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadNearbyPage(nextPage: number) {
    if (!coordinates) return;
    setIsLoading(true);
    setError(null);
    try {
      const nearbyData = await getBrowseRequests({
        page: nextPage,
        categoryId,
        ...coordinates,
      });
      setNearbyData(nearbyData);
    } catch (reason: unknown) {
      setError(getLocationError(reason));
    } finally {
      setIsLoading(false);
    }
  }

  function showAllRequests() {
    setCoordinates(null);
    setError(null);
  }

  const isNearby = coordinates !== null;
  const data = isNearby ? nearbyData : initialData;
  const requests: Request[] = data?.items ?? [];
  const page = isNearby ? data?.pagination.page ?? 1 : initialPage;
  const pagination = data?.pagination;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-ink">
            {isNearby ? 'Requests near you' : 'Find requests near you'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Share your location to let the board find nearby requests. Your
            coordinates are only sent after you choose to share them.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadNearby()}
            disabled={isLoading}
            className="min-h-10 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading
              ? 'Finding nearby requests…'
              : isNearby
                ? 'Update my location'
                : 'Use my location'}
          </button>
          {isNearby && (
            <button
              type="button"
              onClick={showAllRequests}
              disabled={isLoading}
              className="min-h-10 rounded-full border border-border px-4 py-2 text-sm font-bold text-ink-muted transition hover:border-primary/40 disabled:opacity-60"
            >
              Show all
            </button>
          )}
        </div>
      </div>

      {(error ?? initialError) && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error ?? initialError}
        </div>
      )}

      {data && requests.length === 0 && (
        <div className="py-20 text-center text-ink-muted">
          <p className="mb-3 text-4xl">📭</p>
          <p className="mb-1 text-lg font-semibold">
            {isNearby
              ? 'No nearby requests found.'
              : 'Nothing on the board yet.'}
          </p>
          <p className="text-sm">
            {isNearby
              ? 'Try showing all requests or check again later.'
              : 'Be the first to post a request.'}
          </p>
          {!isNearby && (
            <Link
              href="/post"
              className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 font-bold text-white"
            >
              Post a request
            </Link>
          )}
          {isNearby && (
            <button
              type="button"
              onClick={showAllRequests}
              className="mt-6 rounded-full bg-primary px-5 py-2.5 font-bold text-white"
            >
              Show all requests
            </button>
          )}
        </div>
      )}

      {requests.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                currentUserId={currentUserId}
              />
            ))}
          </div>

          {pagination && (
            <div className="mt-10 flex justify-center gap-3">
              {page > 1 &&
                (isNearby ? (
                  <button
                    type="button"
                    onClick={() => void loadNearbyPage(page - 1)}
                    disabled={isLoading}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40 disabled:opacity-60"
                  >
                    ← Previous
                  </button>
                ) : (
                  <Link
                    href={`/browse?page=${page - 1}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40"
                  >
                    ← Previous
                  </Link>
                ))}
              <span className="px-4 py-2 text-sm text-ink-muted">
                Page {page} of {pagination.totalPages}
              </span>
              {pagination.hasMore &&
                (isNearby ? (
                  <button
                    type="button"
                    onClick={() => void loadNearbyPage(page + 1)}
                    disabled={isLoading}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40 disabled:opacity-60"
                  >
                    Next →
                  </button>
                ) : (
                  <Link
                    href={`/browse?page=${page + 1}${categoryId ? `&categoryId=${categoryId}` : ''}`}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40"
                  >
                    Next →
                  </Link>
                ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
