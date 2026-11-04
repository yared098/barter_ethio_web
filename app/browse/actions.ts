'use server';

import { apiFetch, type RequestList } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export async function getBrowseRequests({
  page,
  categoryId,
  latitude,
  longitude,
}: {
  page: number;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
}): Promise<RequestList> {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a positive integer.');
  }

  const hasLatitude = latitude !== undefined;
  const hasLongitude = longitude !== undefined;
  if (
    hasLatitude !== hasLongitude ||
    (hasLatitude &&
      (!Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude! < -90 ||
        latitude! > 90 ||
        longitude! < -180 ||
        longitude! > 180))
  ) {
    throw new Error('A valid latitude and longitude pair is required.');
  }

  const query = new URLSearchParams({
    scope: 'all',
    page: String(page),
    limit: '20',
  });
  if (categoryId) query.set('categoryId', categoryId);
  if (hasLatitude && hasLongitude) {
    query.set('lat', String(latitude));
    query.set('lng', String(longitude));
  }

  return apiFetch<RequestList>(`/requests?${query}`, {
    token: await getAccessToken(),
  });
}
