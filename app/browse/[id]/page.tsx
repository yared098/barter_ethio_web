import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, Request } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { formatBudget, relativeDate } from '@/lib/utils';
import { ReplyForm } from '@/components/reply-form';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const token = await getAccessToken();
  try {
    const r = await apiFetch<Request>(`/requests/${id}`, { token });
    return {
      title: r.title,
      description: r.description.slice(0, 160),
      openGraph: {
        title: r.title,
        description: r.description.slice(0, 160),
        type: 'article',
      },
    };
  } catch {
    return { title: 'Request' };
  }
}

export default async function RequestDetailPage({ params }: Params) {
  const { id } = await params;
  const token = await getAccessToken();

  let request: Request | null = null;
  try {
    request = await apiFetch<Request>(`/requests/${id}`, { token });
  } catch (e: any) {
    if (e?.status === 404) notFound();
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

  // JSON-LD structured data for Google rich results
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
            minPrice: request.budgetMin,
            maxPrice: request.budgetMax,
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

      <nav className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/browse"
            className="text-sm font-semibold text-ink-muted hover:text-primary"
          >
            ← Back to board
          </Link>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-10">
        {/* ── Meta chips ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-md">
            {request.category?.icon || '📦'} {request.category?.name || '—'}
          </span>
          <span className="inline-flex items-center text-xs font-bold text-ink-muted bg-border/40 px-2 py-1 rounded-md">
            {request.type}
          </span>
          <span className="text-xs text-ink-subtle ml-auto">
            {relativeDate(request.createdAt)}
          </span>
        </div>

        {/* ── Title ── */}
        <h1 className="text-3xl md:text-4xl font-black text-ink leading-tight mb-4">
          {request.title}
        </h1>

        {/* ── Description ── */}
        <p className="text-base text-ink-muted leading-relaxed whitespace-pre-wrap mb-6">
          {request.description}
        </p>

        {/* ── Image gallery ── */}
        {request.images && request.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {request.images.map((img, i) => (
              <div
                key={i}
                className="aspect-square bg-primary-light rounded-xl overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${request.title} — image ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Budget + Location ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-primary-light/40 rounded-xl p-4">
            <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
              Budget
            </div>
            <div className="text-lg font-black text-ink">
              {formatBudget(request.budgetMin, request.budgetMax)}
            </div>
          </div>
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

        {/* ── Author + Reply ── */}
        <div className="border-t border-border pt-6">
          <p className="text-sm text-ink-muted mb-4">
            Posted by{' '}
            <strong className="text-ink">
              {request.author?.name || 'Anonymous'}
            </strong>
          </p>

          {token ? (
            <ReplyForm requestId={request.id} />
          ) : (
            <Link
              href={`/auth/login?next=/browse/${request.id}`}
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full transition"
            >
              Sign in to reply
            </Link>
          )}
        </div>
      </article>
    </main>
  );
}