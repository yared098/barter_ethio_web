import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import { MyProductCard } from '@/components/my-product-card';
import type { MyProduct } from '@/lib/products';

export const metadata = { title: 'My products' };
export const dynamic = 'force-dynamic';

type Tab = 'all' | 'available' | 'pending' | 'swapped';

export default async function MyProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: Tab }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/products');

  const sp = await searchParams;
  const tab: Tab = sp.tab ?? 'all';

  const token = await getAccessToken();
  let products: MyProduct[] = [];
  let productsError: string | null = null;
  try {
    products = await apiFetch<MyProduct[]>('/products?mine=true', { token });
  } catch (error: unknown) {
    productsError =
      error instanceof Error ? error.message : 'Could not load your products.';
  }

  const counts = {
    all: products.length,
    available: products.filter((p) => p.status === 'AVAILABLE').length,
    pending: products.filter((p) => p.status === 'PENDING').length,
    swapped: products.filter((p) => p.status === 'SWAPPED').length,
  };

  const filtered =
    tab === 'all'
      ? products
      : products.filter((p) => p.status === tab.toUpperCase());

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-600 hover:text-primary transition"
          >
            ← Dashboard
          </Link>
          <Link
            href="/product/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary-dark px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            + New product
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
          My products
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Everything you&apos;ve listed. Delete or edit anytime while available.
        </p>

        <div
          role="group"
          aria-label="Filter products by status"
          className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-4"
        >
          {(['all', 'available', 'pending', 'swapped'] as const).map((t) => (
            <Link
              key={t}
              href={`/products${t === 'all' ? '' : `?tab=${t}`}`}
              aria-current={tab === t ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                tab === t
                  ? 'bg-primary-dark text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums ${
                  tab === t ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                }`}
              >
                {counts[t]}
              </span>
            </Link>
          ))}
        </div>

        {productsError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            Could not load your products. {productsError}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              No products yet
            </p>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
              List something you want to trade and start receiving offers.
            </p>
            <Link
              href="/product/new"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary-dark px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              List your first product
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-bold text-slate-900 mb-1">
              No {tab} products
            </p>
            <Link
              href="/products"
              className="inline-block mt-3 text-sm font-bold text-primary hover:underline"
            >
              See all ({counts.all})
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <MyProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
