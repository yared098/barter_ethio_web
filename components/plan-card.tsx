import { badgeLabel, type Plan } from '@/lib/payments';
import { UpgradeButton } from './upgrade-button';

type Props = {
  plan: Plan;
  isAuthenticated: boolean;
};

export function PlanCard({ plan, isAuthenticated }: Props) {
  const badge = badgeLabel(plan.badgeKey);

  return (
    <div
      className={`relative bg-white rounded-2xl p-6 transition ${
        plan.highlighted
          ? 'border-2 border-primary shadow-lg'
          : 'border border-border hover:border-primary/40'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider whitespace-nowrap">
          {badge}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
          {plan.label}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-ink">{plan.price}</span>
          <span className="text-sm font-bold text-ink-muted">{plan.currency}</span>
        </div>
      </div>

      <p className="text-sm text-ink-muted leading-relaxed mb-6 min-h-[40px]">
        {plan.description}
      </p>

      <UpgradeButton
        planId={plan.id}
        price={plan.price}
        currency={plan.currency}
        highlighted={plan.highlighted}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}