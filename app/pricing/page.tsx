import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { type Plan } from '@/lib/payments';
import { PlanCard } from '@/components/plan-card';

export const metadata = {
  title: 'Pricing — trade more, pay less',
  description:
    'Barter Ethio plans: Daily pass, credit packs, and PRO subscriptions. Pay with Telebirr, CBE, Awash or card via Chapa.',
};

export const revalidate = 300;

export default async function PricingPage() {
  const user = await getCurrentUser();

  let plans: Plan[] = [];
  try {
    plans = await apiFetch<Plan[]>('/payments/plans');
  } catch {
    /* empty */
  }

  const dailies = plans.filter((p) => p.tier === 'daily');
  const credits = plans.filter((p) => p.tier === 'credit');
  const pros = plans.filter((p) => p.tier === 'pro');

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-extrabold text-ink">
              Barter<span className="text-primary">Ethio</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/browse" className="text-sm font-semibold text-ink-muted hover:text-primary">
              Browse
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-full transition"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login?next=/pricing"
                className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-full transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-ink mb-4">
            Simple, fair pricing
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            Start free. Upgrade when you need more. All plans paid securely through Chapa.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
            Always free
          </h2>
          <div className="max-w-sm">
            <div className="bg-white border border-border rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                  Free plan
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-ink">0</span>
                  <span className="text-sm font-bold text-ink-muted">ETB</span>
                </div>
              </div>
              <p className="text-sm text-ink-muted mb-6">
                1 post per day · 3 visible matches
              </p>
              <Link
                href={user ? '/dashboard' : '/auth/login'}
                className="block text-center bg-primary-light text-primary font-bold py-3 rounded-full hover:bg-primary hover:text-white transition"
              >
                {user ? 'Go to dashboard' : 'Start free'}
              </Link>
            </div>
          </div>
        </section>

        {dailies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
              Daily pass
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailies.map((p) => (
                <PlanCard key={p.id} plan={p} isAuthenticated={!!user} />
              ))}
            </div>
          </section>
        )}

        {credits.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
              Credit packs
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {credits.map((p) => (
                <PlanCard key={p.id} plan={p} isAuthenticated={!!user} />
              ))}
            </div>
          </section>
        )}

        {pros.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
              PRO subscription
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {pros.map((p) => (
                <PlanCard key={p.id} plan={p} isAuthenticated={!!user} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}