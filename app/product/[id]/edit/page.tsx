import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import { EditProductForm } from '@/components/edit-product-form';

type Params = { params: Promise<{ id: string }> };

type Product = {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  estimatedValue: number;
  categoryId: string;
  status: string;
  ownerId: string;
};

type Category = { id: string; name: string; icon: string | null; slug: string };

export const metadata = { title: 'Edit product' };
export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/product/${id}/edit`);

  const token = await getAccessToken();

  const [product, categories] = await Promise.all([
    apiFetch<Product>(`/products/${id}`, { token }).catch(() => null),
    apiFetch<Category[]>('/categories', { token }).catch(() => []),
  ]);

  if (!product) notFound();

  if (product.ownerId !== user.id) redirect('/products');
  if (product.status !== 'AVAILABLE') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4 text-3xl">
            ⚠️
          </div>
          <p className="text-base font-bold text-slate-900 mb-1">
            Can&apos;t edit this product
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Products that are in a deal or already swapped can&apos;t be edited.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition"
          >
            Back to my products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/products"
            className="flex items-center gap-2 text-slate-600 hover:text-primary transition text-sm font-semibold"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            My products
          </Link>
          <h1 className="font-black text-slate-900">Edit product</h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <EditProductForm product={product} categories={categories} />
        </div>
      </div>
    </main>
  );
}
