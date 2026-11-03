import Link from 'next/link';
import { Request } from '@/lib/api';
import { formatBudget, relativeDate, resolveImage } from '@/lib/utils';

export function RequestCard({ request }: { request: Request }) {
  const image = resolveImage(request.images?.[0]);

  return (
    <Link
      href={`/browse/${request.id}`}
      className="group block bg-white border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition"
    >
      {image && (
        <div className="aspect-[16/9] bg-primary-light overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={request.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md">
            {request.category?.icon || '📦'} {request.category?.name || '—'}
          </span>
          <span className="text-xs text-ink-subtle">
            {relativeDate(request.createdAt)}
          </span>
        </div>

        <h3 className="text-base font-bold text-ink leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {request.title}
        </h3>

        <p className="text-xs text-ink-subtle mb-2">
          Posted by {request.author?.name || 'Anonymous'}
        </p>

        <p className="text-sm text-ink-muted leading-relaxed line-clamp-2 mb-3">
          {request.description}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-ink">
            {formatBudget(request.budgetMin, request.budgetMax)}
          </span>
          {request.location && (
            <span className="text-ink-muted">📍 {request.location}</span>
          )}
        </div>
      </div>
    </Link>
  );
}