'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, ApiError } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export async function deleteProductAction(productId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in required');

  try {
    await apiFetch(`/products/${productId}`, { method: 'DELETE', token });
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }

  revalidatePath('/products');
  revalidatePath('/dashboard');
}

export async function updateProductAction(
  productId: string,
  payload: {
    title?: string;
    description?: string;
    condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
    estimatedValue?: number;
    categoryId?: string;
    images?: string[];
    wants?: Array<{
      categoryId: string;
      keywords?: string;
      minValue?: number;
      maxValue?: number;
    }>;
  },
) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in required');

  try {
    const updated = await apiFetch<{ id: string }>(`/products/${productId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    revalidatePath('/products');
    revalidatePath('/dashboard');
    revalidatePath(`/product/${productId}`);

    return updated;
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }
}