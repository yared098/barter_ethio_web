import Link from 'next/link';
import { Request } from '@/lib/api';
import { formatBudget, relativeDate } from '@/lib/utils';

export function RequestCard({ request }: { request: Request }) {
  return (
    <Link
      href={`/browse/${request.id}`}
      className="block bg-white border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-md">
          {request.category?.icon || '📦'} {request.category?.name || '—'}
        </span>
        <span className="text-xs text-ink-subtle">{relativeDate(request.createdAt)}</span>
      </div>

      <h3 className="text-base font-bold text-ink leading-snug mb-2 line-clamp-2">
        {request.title}
      </h3>

      <p className="text-sm text-ink-muted leading-relaxed line-clamp-2 mb-3">
        {request.description}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-ink">{formatBudget(request.budgetMin, request.budgetMax)}</span>
        {request.location && (
          <span className="text-ink-muted">📍 {request.location}</span>
        )}
      </div>
    </Link>
  );
}