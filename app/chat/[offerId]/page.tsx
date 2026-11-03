import { notFound, redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import type { ChatOffer } from '@/lib/chat';
import { ChatDetail } from '@/components/chat-detail';

type Params = { params: Promise<{ offerId: string }> };

export async function generateMetadata({ params }: Params) {
  const { offerId } = await params;
  const token = await getAccessToken();
  try {
    const offer = await apiFetch<ChatOffer>(`/offers/${offerId}`, { token });
    const otherName =
      offer.sender?.name || offer.receiver?.name || 'Barter User';
    return {
      title: `Chat with ${otherName}`,
      description:
        offer.offeredProduct?.title ||
        offer.requestedProduct?.title ||
        'Barter conversation',
    };
  } catch {
    return { title: 'Chat' };
  }
}

export default async function ChatDetailPage({ params }: Params) {
  const { offerId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/chat/${offerId}`);

  const token = await getAccessToken();

  let offer: ChatOffer | null = null;
  try {
    offer = await apiFetch<ChatOffer>(`/offers/${offerId}`, { token });
  } catch (e: any) {
    if (e?.status === 404) notFound();
    if (e?.status === 403 || e?.status === 401) redirect('/chat');
    throw e;
  }

  if (!offer) notFound();
  if (offer.senderId !== user.id && offer.receiverId !== user.id) {
    redirect('/chat');
  }

  return <ChatDetail initialOffer={offer} meId={user.id} />;
}