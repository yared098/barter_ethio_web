import Link from 'next/link';
import {
  otherParty,
  subjectProduct,
  statusLabel,
  statusBadgeClass,
  timeAgo,
  type ChatOffer,
} from '@/lib/chat';
import { UserAvatar } from './user-avatar';

type Props = {
  offer: ChatOffer;
  meId: string;
};

export function ChatListItem({ offer, meId }: Props) {
  const other = otherParty(offer, meId);
  const product = subjectProduct(offer, meId);
  const preview = offer.message?.trim() || 'No message';
  const isIncoming = offer.receiverId === meId;
  const isUnread = isIncoming && offer.status === 'PENDING';
  const isClosed = ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(offer.status);

  return (
    <Link
      href={`/chat/${offer.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-divider last:border-b-0 hover:bg-primary-light/20 active:bg-primary-light/40 transition"
    >
      {/* Avatar + unread dot */}
      <div className="relative flex-shrink-0">
        <UserAvatar name={other.name} image={other.image} size={54} />
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={`text-[15px] truncate ${
              isUnread ? 'font-bold text-ink' : 'font-semibold text-ink'
            }`}
          >
            {other.name || 'Barter User'}
          </span>
          <span className="text-[11px] text-ink-subtle flex-shrink-0">
            {timeAgo(offer.updatedAt)}
          </span>
        </div>

        {product && (
          <div className="flex items-center gap-1 mb-0.5">
            {/* Direction arrow chip */}
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isIncoming
                  ? 'bg-primary-light text-primary'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isIncoming ? '↙ IN' : '↗ OUT'}
            </span>
            <span className="text-[11px] text-ink-muted truncate">
              {isIncoming ? 'They offered' : 'You offered'} · {product.title}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[13px] truncate ${
              isUnread ? 'font-semibold text-ink' : 'text-ink-muted'
            } ${isClosed ? 'opacity-70' : ''}`}
          >
            {preview}
          </span>
          {offer.status !== 'PENDING' && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusBadgeClass(
                offer.status,
              )}`}
            >
              {statusLabel(offer.status)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}