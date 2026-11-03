import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { OfferForm } from '@/components/offer-form';
import { resolveImage } from '@/lib/utils';

type Product = {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  estimatedValue: number;
  status: string;
  category?: { id: string; name: string; icon: string | null };
  owner?: { id: string; name: string | null; image: string | null };
  wants?: Array<{
    categoryId: string;
    keywords: string | null;
    category?: { name: string };
  }>;
};

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  try {
    const p = await apiFetch<Product>(`/products/${id}`);
    return {
      title: p.title,
      description: p.description.slice(0, 160),
      openGraph: { title: p.title, description: p.description.slice(0, 160) },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductDetailPage({ params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();

  let product: Product | null = null;
  try {
    product = await apiFetch<Product>(`/products/${id}`);
  } catch (e: any) {
    if (e?.status === 404) notFound();
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-muted">Could not load product.</p>
      </main>
    );
  }

  const isOwner = !!user && user.id === product.owner?.id;
  const canOffer = !isOwner && product.status === 'AVAILABLE';

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/browse"
            className="text-sm font-semibold text-ink-muted hover:text-primary"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-8">
        {product.images && product.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {product.images.map((img, i) => (
              <div
                key={i}
                className="aspect-square bg-primary-light rounded-xl overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImage(img) ?? ''}
                  alt={`${product.title} — ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-md">
            {product.category?.icon || '📦'} {product.category?.name || '—'}
          </span>
          <span className="inline-flex items-center text-xs font-bold text-ink-muted bg-border/40 px-2 py-1 rounded-md">
            {product.condition}
          </span>
          <span className="inline-flex items-center text-xs font-bold text-ink-muted bg-border/40 px-2 py-1 rounded-md">
            {product.status}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-ink leading-tight mb-4">
          {product.title}
        </h1>

        <p className="text-base text-ink-muted leading-relaxed whitespace-pre-wrap mb-6">
          {product.description}
        </p>

        <div className="bg-primary-light/40 rounded-xl p-4 mb-8">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
            Estimated value
          </div>
          <div className="text-2xl font-black text-ink">
            {product.estimatedValue?.toLocaleString()} ETB
          </div>
        </div>

        {product.wants && product.wants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-ink mb-3">
              Looking for in return
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.wants.map((w, i) => (
                <span
                  key={i}
                  className="text-xs font-bold bg-primary-light text-primary px-3 py-1.5 rounded-full"
                >
                  {w.category?.name || '—'}
                  {w.keywords ? ` · ${w.keywords}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-6">
          <p className="text-sm text-ink-muted mb-4">
            Listed by{' '}
            <strong className="text-ink">
              {product.owner?.name || 'Anonymous'}
            </strong>
          </p>

          {!user && (
            <Link
              href={`/auth/login?next=/product/${product.id}`}
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full transition"
            >
              Sign in to send an offer
            </Link>
          )}

          {user && isOwner && (
            <div className="bg-primary-light/40 rounded-xl p-4 text-sm text-ink-muted">
              This is your own product. Offers you receive will appear in{' '}
              <Link href="/chat" className="text-primary font-bold underline">
                Chats
              </Link>
              .
            </div>
          )}

          {user && canOffer && (
            <div>
              <h2 className="text-lg font-bold text-ink mb-3">Send an offer</h2>
              <OfferForm
                requestedProductId={product.id}
                requestedProductTitle={product.title}
              />
            </div>
          )}

          {user && !isOwner && product.status !== 'AVAILABLE' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              This product is {product.status.toLowerCase()} and cannot receive
              new offers.
            </div>
          )}
        </div>
      </article>
    </main>
  );
}