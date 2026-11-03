import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CreateRequestForm } from '@/components/create-request-form';

export const metadata = { title: 'Post a request' };

export default async function PostPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/post');

  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-semibold text-ink-muted hover:text-primary">
            ← Dashboard
          </Link>
          <Link href="/browse" className="text-sm font-semibold text-ink-muted hover:text-primary">
            Browse board →
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Post a request</h1>
          <p className="text-ink-muted">
            Tell people what you need. Sellers will come to you.
          </p>
        </div>

        <CreateRequestForm />
      </div>
    </main>
  );
}