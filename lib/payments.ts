// ── Plan types (matches GET /payments/plans response) ──
export type PlanTier = 'daily' | 'credit' | 'pro';

export type Plan = {
  id: string;
  label: string;
  price: number;
  currency: string;
  description: string;
  tier: PlanTier;
  badgeKey: string | null;
  highlighted: boolean;
  dailyCap: number;
  periodLimit: number;
  periodDays: number | null;
};

// ── Payment init response ──
export type InitPaymentResponse = {
  paymentId: string;
  txRef: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  planLabel: string;
  expiresAt: string;
};

// ── Payment status (polls every 2s) ──
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export type PaymentStatusResponse = {
  paymentId: string;
  txRef: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  expiresAt: string;
  paidAt: string | null;
};

// ── Posting status (mirror of backend helper) ──
export const FREE_DAILY_CAP = 1;
export const PAID_DAILY_CAP = 2;
export const DAILY_PASS_CAP = 10;

export type PostingMode = 'PRO' | 'DAILY' | 'CREDIT' | 'FREE';

export type PostingStatus = {
  mode: PostingMode;
  canPost: boolean;
  reason?: string;
  postsUsedToday: number;
  dailyCap: number;
  postsLeftToday: number;
  budgetLeft: number | null;
  budgetTotal: number | null;
  proExpiresAt: string | null;
  proDaysLeft: number | null;
  dailyPassExpiresAt: string | null;
  creditsRemaining: number;
};

export function computePostingStatus(user: any): PostingStatus {
  const now = new Date();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const postsTodayDate = user.postsTodayDate ? new Date(user.postsTodayDate) : null;
  const isNewDay = !postsTodayDate || postsTodayDate < todayStart;
  const usedToday = isNewDay ? 0 : (user.postsTodayCount ?? 0);
  const credits = user.creditsRemaining ?? 0;

  const proExpiresAt = user.proExpiresAt ? new Date(user.proExpiresAt) : null;
  const dailyPassExpiresAt = user.dailyPassExpiresAt
    ? new Date(user.dailyPassExpiresAt)
    : null;

  // PRO
  if (proExpiresAt && proExpiresAt > now) {
    const budget = user.proBudgetRemaining ?? 0;
    const proDaysLeft = Math.max(
      0,
      Math.ceil((proExpiresAt.getTime() - now.getTime()) / 86400000),
    );
    const dayLeft = Math.max(0, PAID_DAILY_CAP - usedToday);
    const canPost = budget > 0 && dayLeft > 0;

    let reason: string | undefined;
    if (dayLeft === 0) {
      reason = `Daily limit reached (${PAID_DAILY_CAP}/day). Try again tomorrow.`;
    } else if (budget === 0) {
      reason = 'PRO budget used up. Pay again or buy a credit pack.';
    }

    return {
      mode: 'PRO',
      canPost,
      reason,
      postsUsedToday: usedToday,
      dailyCap: PAID_DAILY_CAP,
      postsLeftToday: dayLeft,
      budgetLeft: budget,
      budgetTotal: null,
      proExpiresAt: proExpiresAt.toISOString(),
      proDaysLeft,
      dailyPassExpiresAt: dailyPassExpiresAt?.toISOString() ?? null,
      creditsRemaining: credits,
    };
  }

  // DAILY
  if (dailyPassExpiresAt && dailyPassExpiresAt > now) {
    const dayLeft = Math.max(0, DAILY_PASS_CAP - usedToday);
    return {
      mode: 'DAILY',
      canPost: dayLeft > 0,
      reason: dayLeft > 0 ? undefined : `Daily pass used up (${DAILY_PASS_CAP}/${DAILY_PASS_CAP} today).`,
      postsUsedToday: usedToday,
      dailyCap: DAILY_PASS_CAP,
      postsLeftToday: dayLeft,
      budgetLeft: null,
      budgetTotal: null,
      proExpiresAt: null,
      proDaysLeft: null,
      dailyPassExpiresAt: dailyPassExpiresAt.toISOString(),
      creditsRemaining: credits,
    };
  }

  // CREDIT
  if (credits > 0) {
    const dayLeft = Math.max(0, PAID_DAILY_CAP - usedToday);
    return {
      mode: 'CREDIT',
      canPost: dayLeft > 0,
      reason: dayLeft > 0 ? undefined : `Daily limit reached (${PAID_DAILY_CAP}/day). Try again tomorrow.`,
      postsUsedToday: usedToday,
      dailyCap: PAID_DAILY_CAP,
      postsLeftToday: dayLeft,
      budgetLeft: credits,
      budgetTotal: null,
      proExpiresAt: null,
      proDaysLeft: null,
      dailyPassExpiresAt: null,
      creditsRemaining: credits,
    };
  }

  // FREE
  const dayLeft = Math.max(0, FREE_DAILY_CAP - usedToday);
  return {
    mode: 'FREE',
    canPost: dayLeft > 0,
    reason: dayLeft > 0 ? undefined : `Free plan: ${FREE_DAILY_CAP} post/day. Upgrade for more.`,
    postsUsedToday: usedToday,
    dailyCap: FREE_DAILY_CAP,
    postsLeftToday: dayLeft,
    budgetLeft: null,
    budgetTotal: null,
    proExpiresAt: null,
    proDaysLeft: null,
    dailyPassExpiresAt: null,
    creditsRemaining: 0,
  };
}

export function hasPaidAccess(user: any): boolean {
  return computePostingStatus(user).mode !== 'FREE';
}

export function formatETB(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toLocaleString('en-US')} ETB`;
}

export function badgeLabel(key: string | null): string | null {
  switch (key) {
    case 'save_20':
      return 'SAVE 20%';
    case 'save_16':
      return 'SAVE 16%';
    case 'best_value':
      return 'BEST VALUE';
    default:
      return key;
  }
}