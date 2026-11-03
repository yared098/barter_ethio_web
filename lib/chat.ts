// ── Types matching your backend Offer response ──
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';

export type ChatUser = {
  id: string;
  name: string | null;
  image: string | null;
};

export type ChatProduct = {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  condition: string;
  category?: { id: string; name: string; icon: string | null };
  owner?: ChatUser;
};

export type ChatMessage = {
  id: string;
  offerId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
};

export type ChatOffer = {
  id: string;
  senderId: string;
  receiverId: string;
  offeredProductId: string | null;
  requestedProductId: string | null;
  sourceType: string;
  sourceId: string | null;
  status: OfferStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
  receiver: ChatUser;
  offeredProduct: ChatProduct | null;
  requestedProduct: ChatProduct | null;
  messages?: ChatMessage[];
};

// ── Helpers ──

/** The "other" participant from the perspective of `meId`. */
export function otherParty(offer: ChatOffer, meId: string): ChatUser {
  return offer.senderId === meId ? offer.receiver : offer.sender;
}

/** The product that's the subject of the deal (from my perspective). */
export function subjectProduct(offer: ChatOffer, meId: string): ChatProduct | null {
  // If I'm the sender, I'm offering my product → subject is what I want
  // If I'm the receiver, they offered me a product → subject is what they want
  if (offer.senderId === meId) return offer.requestedProduct ?? offer.offeredProduct;
  return offer.requestedProduct ?? offer.offeredProduct;
}

export function isMyTurn(offer: ChatOffer, meId: string): boolean {
  if (offer.status !== 'PENDING') return false;
  // Receiver is the one who can accept/decline
  return offer.receiverId === meId;
}

export function statusLabel(status: OfferStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Accepted';
    case 'COMPLETED':
      return 'Completed';
    case 'DECLINED':
      return 'Declined';
    case 'CANCELLED':
      return 'Cancelled';
  }
}

export function statusBadgeClass(status: OfferStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'bg-primary-light text-primary';
    case 'DECLINED':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-600';
  }
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.floor((now - t) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Initials for avatar fallback. */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}