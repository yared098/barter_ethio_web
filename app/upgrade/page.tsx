import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import { type Plan, computePostingStatus } from '@/lib/payments';
import { PlanCard } from '@/components/plan-card';

export const metadata = { title: 'Upgrade your plan' };

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/upgrade');

  const token = await getAccessToken();

  let plans: Plan[] = [];
  try {
    plans = await apiFetch<Plan[]>('/payments/plans', { token });
  } catch {
    /* fallback to empty */
  }

  const dailies = plans.filter((p) => p.tier === 'daily');
  const credits = plans.filter((p) => p.tier === 'credit');
  const pros = plans.filter((p) => p.tier === 'pro');

  const status = computePostingStatus(user);

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-semibold text-ink-muted hover:text-primary">
            ← Dashboard
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-extrabold text-ink">
              Barter<span className="text-primary">Ethio</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-ink mb-3">
            Upgrade your plan
          </h1>
          <p className="text-ink-muted max-w-xl mx-auto">
            More posts, unlimited matches, and priority support. Pay with
            Telebirr, CBE, Awash, or card via Chapa.
          </p>
        </div>

        <div className="max-w-xl mx-auto bg-primary-light/40 rounded-2xl p-4 mb-10 text-center">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
            Current plan
          </span>
          <div className="text-lg font-black text-ink">{status.mode}</div>
        </div>

        {dailies.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
              Daily pass
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailies.map((p) => (
                <PlanCard key={p.id} plan={p} isAuthenticated={true} />
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
                <PlanCard key={p.id} plan={p} isAuthenticated={true} />
              ))}
            </div>
          </section>
        )}

        {pros.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">
              PRO subscriptions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {pros.map((p) => (
                <PlanCard key={p.id} plan={p} isAuthenticated={true} />
              ))}
            </div>
          </section>
        )}

        {plans.length === 0 && (
          <div className="text-center py-20 text-ink-muted">
            <p>No plans available right now. Try again later.</p>
          </div>
        )}

        <p className="text-center text-xs text-ink-subtle mt-10">
          All plans paid via Chapa · Telebirr, CBE, Awash, or card accepted
        </p>
      </div>
    </main>
  );
}