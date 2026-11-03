'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export async function acceptReplyAction(requestId: string, replyId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to accept a reply');

  let offerId: string | undefined;
  try {
    const result = await apiFetch<{ offerId?: string }>(
      `/requests/${requestId}/responses/${replyId}/accept`,
      { method: 'POST', token },
    );
    offerId = result?.offerId;
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }

  revalidatePath(`/browse/${requestId}`);
  revalidatePath('/browse');
  revalidatePath('/chat');
  revalidatePath('/dashboard');

  if (offerId) {
    redirect(`/chat/${offerId}`);
  }
}

export async function withdrawReplyAction(requestId: string, replyId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to withdraw your reply');

  try {
    await apiFetch(`/requests/${requestId}/responses/${replyId}`, {
      method: 'DELETE',
      token,
    });
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }

  revalidatePath(`/browse/${requestId}`);
}