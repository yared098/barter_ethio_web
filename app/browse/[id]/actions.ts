'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

// Endpoints confirmed from src/requests/requests.controller.ts
const acceptPath = (requestId: string, replyId: string) =>
  `/requests/${requestId}/replies/${replyId}/accept`;

const rejectPath = (requestId: string, replyId: string) =>
  `/requests/${requestId}/replies/${replyId}/reject`;

const withdrawPath = (requestId: string, replyId: string) =>
  `/requests/${requestId}/replies/${replyId}`;

export async function acceptReplyAction(requestId: string, replyId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to accept a reply');

  let offerId: string | undefined;
  try {
    const result = await apiFetch<{
      requestId: string;
      replyId: string;
      offerId: string;
      status: 'CLOSED';
    }>(acceptPath(requestId, replyId), { method: 'POST', token });
    offerId = result?.offerId;
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }

  revalidatePath(`/browse/${requestId}`);
  revalidatePath('/browse');
  revalidatePath('/chat');
  revalidatePath('/dashboard');

  if (offerId) redirect(`/chat/${offerId}`);
}

export async function rejectReplyAction(requestId: string, replyId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to reject a reply');

  try {
    await apiFetch(rejectPath(requestId, replyId), {
      method: 'POST',
      token,
    });
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }

  revalidatePath(`/browse/${requestId}`);
  revalidatePath('/browse');
}

export async function withdrawReplyAction(requestId: string, replyId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Sign in to withdraw your reply');

  try {
    await apiFetch(withdrawPath(requestId, replyId), {
      method: 'DELETE',
      token,
    });
  } catch (e: unknown) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }

  revalidatePath(`/browse/${requestId}`);
}