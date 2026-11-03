import { formatMessageTime, type ChatMessage } from '@/lib/chat';
import { UserAvatar } from './user-avatar';

type Props = {
  message: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
};

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  isLastInGroup,
}: Props) {
  return (
    <div
      className={`flex items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${
        isLastInGroup ? 'mb-2' : 'mb-0.5'
      }`}
    >
      {/* Avatar slot on the left — 28px reserved for every received row */}
      {!isMine && (
        <div className="w-7 flex-shrink-0">
          {showAvatar && (
            <UserAvatar
              name={message.sender.name}
              image={message.sender.image}
              size={28}
            />
          )}
        </div>
      )}

      <div
        className={`max-w-[78%] px-3 py-2 ${
          isMine
            ? `bg-primary text-white ${isLastInGroup ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
            : `bg-white border border-border text-ink ${isLastInGroup ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
        } shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
      >
        <div className="text-[14px] leading-[1.4] whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div
          className={`text-[10px] text-right mt-1 tabular-nums ${
            isMine ? 'text-white/65' : 'text-ink-subtle'
          }`}
        >
          {formatMessageTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}