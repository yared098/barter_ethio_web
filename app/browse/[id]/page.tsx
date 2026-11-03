import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, Request, Reply } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { formatBudget, relativeDate } from '@/lib/utils';
import { ReplyForm } from '@/components/reply-form';
import { ReplyActions } from '@/components/reply-actions';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const token = await getAccessToken();
  try {
    const r = await apiFetch<Request>(`/requests/${id}`, { token });
    return {
      title: r.title,
      description: (r.description || '').slice(0, 160),
      openGraph: {
        title: r.title,
        description: (r.description || '').slice(0, 160),
        type: 'article',
      },
    };
  } catch {
    return { title: 'Request' };
  }
}

function normalizeImages(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is string => typeof x === 'string' && x.trim().length > 0,
    );
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return [raw.trim()];
  }
  return [];
}

export default async function RequestDetailPage({ params }: Params) {
  const { id } = await params;
  const token = await getAccessToken();

  let request: Request | null = null;
  try {
    request = await apiFetch<Request>(`/requests/${id}`, { token });
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status;
    if (status === 404) notFound();
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-muted mb-4">Could not load this request.</p>
          <Link href="/browse" className="text-primary font-semibold">
            ← Back to board
          </Link>
        </div>
      </main>
    );
  }

  const responses = request.responses ?? [];
  const status = request.status ?? 'OPEN';
  const isAuthor = request.isAuthor === true;
  const canRespond =
    request.canRespond ??
    (!isAuthor && status === 'OPEN' && responses.length === 0);
  const canAccept =
    request.canAccept ??
    (isAuthor && status === 'OPEN' && responses.length > 0);

  const images = normalizeImages((request as { images?: unknown }).images);
  const specs = request.specifications ?? {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Demand',
    name: request.title,
    description: request.description,
    datePosted: request.createdAt,
    ...(request.budgetMin || request.budgetMax
      ? {
          priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: 'ETB',
            minPrice: request.budgetMin ?? undefined,
            maxPrice: request.budgetMax ?? undefined,
          },
        }
      : {}),
    ...(request.location
      ? {
          availableAtOrFrom: {
            '@type': 'Place',
            name: request.location,
          },
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/browse"
            className="text-sm font-semibold text-ink-muted hover:text-primary transition"
          >
            ← Back to board
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-ink-muted hover:text-primary transition"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-10">
        {/* Top chips: category / type / status / date */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {request.category && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-md">
              {request.category.icon || '📦'} {request.category.name}
            </span>
          )}
          {request.type && (
            <span className="inline-flex items-center text-xs font-bold text-ink-muted bg-border/40 px-2 py-1 rounded-md">
              {request.type}
            </span>
          )}
          <StatusChip status={status} />
          <span className="text-xs text-ink-subtle ml-auto">
            {relativeDate(request.createdAt)}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-ink leading-tight mb-4">
          {request.title}
        </h1>

        {request.description && (
          <p className="text-base text-ink-muted leading-relaxed whitespace-pre-wrap mb-6">
            {request.description}
          </p>
        )}

        {/* Image gallery — click opens full size in a new tab */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {images.map((src, i) => (
              <a
                key={`${src}-${i}`}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="aspect-square bg-primary-light rounded-xl overflow-hidden block group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${request.title} — image ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}

        {/* Specifications */}
        {Object.keys(specs).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(specs).map(([k, v]) => (
              <span
                key={k}
                className="px-2 py-1 rounded-md bg-primary/10 text-xs font-bold text-primary"
              >
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}

        {/* Budget + Location */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {(request.budgetMin != null || request.budgetMax != null) && (
            <div className="bg-primary-light/40 rounded-xl p-4">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                Budget
              </div>
              <div className="text-lg font-black text-ink">
                {formatBudget(request.budgetMin ?? null, request.budgetMax ?? null)}
              </div>
            </div>
          )}
          {request.location && (
            <div className="bg-primary-light/40 rounded-xl p-4">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                Location
              </div>
              <div className="text-lg font-black text-ink">
                📍 {request.location}
              </div>
            </div>
          )}
        </div>

        {/* Author line */}
        <p className="text-sm text-ink-muted mb-6">
          Posted by{' '}
          <strong className="text-ink">
            {request.author?.name || 'Anonymous'}
          </strong>
        </p>

        {/* CLOSED banner */}
        {status === 'CLOSED' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 flex items-start gap-2">
            <span className="text-green-700 shrink-0">✓</span>
            <p className="text-sm text-green-800 font-semibold">
              This request is closed. A reply has been accepted.
            </p>
          </div>
        )}

        <div className="border-t border-border pt-6">
          {/* AUTHOR VIEW: reply list with Accept */}
          {isAuthor && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-ink">
                  {canAccept
                    ? 'Pick the best offer'
                    : `Replies (${responses.length})`}
                </h2>
                {responses.length > 0 && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {responses.length}
                  </span>
                )}
              </div>

              {responses.length === 0 ? (
                <div className="bg-primary-light/50 rounded-xl p-4 flex items-center gap-2 text-sm text-ink-muted">
                  <span>⏳</span>
                  <span>No replies yet. Waiting for offers…</span>
                </div>
              ) : (
                <ul className="space-y-3">
                  {responses.map((rep) => (
                    <li key={rep.id}>
                      <ReplyTile
                        reply={rep}
                        requestId={request!.id}
                        isAuthor
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* NON-AUTHOR VIEW */}
          {!isAuthor && (
            <section>
              {!token ? (
                status === 'OPEN' && (
                  <Link
                    href={`/auth/login?next=/browse/${request.id}`}
                    className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full transition"
                  >
                    Sign in to reply
                  </Link>
                )
              ) : responses.length > 0 ? (
                <>
                  <h2 className="text-lg font-black text-ink mb-3">
                    Your reply
                  </h2>
                  <ul className="space-y-3">
                    {responses.map((rep) => (
                      <li key={rep.id}>
                        <ReplyTile
                          reply={rep}
                          requestId={request!.id}
                          isAuthor={false}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              ) : canRespond ? (
                <>
                  <h2 className="text-lg font-black text-ink mb-3">
                    Respond to this request
                  </h2>
                  <ReplyForm requestId={request.id} />
                </>
              ) : null}
            </section>
          )}
        </div>
      </article>
    </main>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN: { label: 'Open', cls: 'bg-primary/10 text-primary' },
    CLOSED: { label: 'Closed', cls: 'bg-green-100 text-green-800' },
    FULFILLED: { label: 'Fulfilled', cls: 'bg-green-100 text-green-800' },
    EXPIRED: { label: 'Expired', cls: 'bg-gray-100 text-gray-600' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
  };
  const c = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-md ${c.cls}`}
    >
      {c.label}
    </span>
  );
}

function ReplyTile({
  reply,
  requestId,
  isAuthor,
}: {
  reply: Reply;
  requestId: string;
  isAuthor: boolean;
}) {
  const isPending = reply.status === 'PENDING';
  return (
    <div
      className={`border rounded-xl p-4 ${
        reply.status === 'ACCEPTED'
          ? 'border-green-600/60 ring-1 ring-green-600/20'
          : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink truncate">
            {reply.responder?.name || 'Anonymous'}
          </p>
          {reply.product && (
            <p className="text-xs text-ink-muted">
              Offers: {reply.product.title}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          {reply.offeredPrice != null && (
            <p className="text-sm font-black text-primary">
              ETB {reply.offeredPrice.toLocaleString()}
            </p>
          )}
          {reply.status !== 'PENDING' && (
            <span
              className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                reply.status === 'ACCEPTED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {reply.status}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-ink leading-relaxed mb-3 whitespace-pre-wrap">
        {reply.message}
      </p>

      {isPending && (
        <ReplyActions
          requestId={requestId}
          replyId={reply.id}
          isAuthor={isAuthor}
        />
      )}
    </div>
  );
}