import Link from 'next/link';
import { Request } from '@/lib/api';
import { formatBudget, relativeDate, resolveImage } from '@/lib/utils';

export function RequestCard({
  request,
  currentUserId,
}: {
  request: Request;
  currentUserId?: string;
}) {
  const image = resolveImage(request.images?.[0]);
  const isOwnRequest =
    currentUserId != null && request.authorId === currentUserId;
  const replyCount = request._count?.responses ?? 0;

  return (
    <Link
      href={`/browse/${request.id}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-white transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {image && (
        <div className="aspect-[16/9] overflow-hidden bg-primary-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={request.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1 break-words rounded-md bg-primary-light px-2 py-1 text-xs font-bold text-primary [overflow-wrap:anywhere]">
            {request.category?.icon || '📦'} {request.category?.name || '—'}
          </span>
          <span className="shrink-0 text-xs text-ink-subtle">
            {relativeDate(request.createdAt)}
          </span>
        </div>

        <h3 className="mb-2 break-words text-base font-bold leading-snug text-ink transition-colors group-hover:text-primary [overflow-wrap:anywhere]">
          {request.title}
        </h3>

        <div className="mb-3">
          {isOwnRequest ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              You posted
            </span>
          ) : (
            <p className="break-words text-xs text-ink-subtle">
              Posted by {request.author?.name || 'Anonymous'}
            </p>
          )}
        </div>

        <p className="mb-4 break-words text-sm leading-relaxed text-ink-muted [overflow-wrap:anywhere] line-clamp-3">
          {request.description}
        </p>

        <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
          <span className="min-w-0 max-w-full break-words text-sm font-bold text-ink [overflow-wrap:anywhere]">
            {formatBudget(request.budgetMin, request.budgetMax)}
          </span>
          <span className="inline-flex shrink-0 items-center rounded-full bg-primary-light px-2.5 py-1 text-xs font-bold text-primary">
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
          {request.location && (
            <span className="w-full break-words text-xs text-ink-muted [overflow-wrap:anywhere]">
              📍 {request.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}