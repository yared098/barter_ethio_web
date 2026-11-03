import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CreateProductForm } from '@/components/create-product-form';

export const metadata = { title: 'List a product' };

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/product/new');

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-ink-muted hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="font-black text-ink">List a product</h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-ink mb-1">
            What are you offering?
          </h2>
          <p className="text-ink-muted text-sm">
            List something you want to trade. Buyers will find you.
          </p>
        </div>

        <CreateProductForm />
      </div>
    </main>
  );
}