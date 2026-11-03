import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getCurrentUser, getAccessToken } from '@/lib/auth';
import { computePostingStatus, hasPaidAccess } from '@/lib/payments';
import type { ChatOffer } from '@/lib/chat';
import type { MatchesResponse } from '@/lib/matches';
import {
  otherParty,
  subjectProduct,
  statusLabel,
  statusBadgeClass,
  timeAgo,
} from '@/lib/chat';
import { PostingStatusPanel } from '@/components/posting-status-panel';
import { DashboardSuccessBanner } from '@/components/dashboard-success-banner';
import { DashboardMatchesSection } from '@/components/dashboard-matches-section';
import { SignOutButton } from '@/components/sign-out-button';
import { UserAvatar } from '@/components/user-avatar';

export const metadata = { title: 'Dashboard' };

type Product = {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  condition: string;
  status: 'AVAILABLE' | 'PENDING' | 'SWAPPED';
  category?: { id: string; name: string; icon: string | null };
  owner?: { id: string; name: string | null; image: string | null };
  wants?: Array<{ categoryId: string; keywords: string | null }>;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/dashboard');

  const sp = await searchParams;
  const upgraded = sp.upgraded === '1';

  const status = computePostingStatus(user);
  const paid = hasPaidAccess(user);
  const token = await getAccessToken();

  // ── Fetch chats + products + matches in parallel ──
  let incoming: ChatOffer[] = [];
  let outgoing: ChatOffer[] = [];
  let myProducts: Product[] = [];
  let matchesData: MatchesResponse | null = null;

  try {
    const [inRes, outRes, prodRes, matchRes] = await Promise.all([
      apiFetch<ChatOffer[]>('/offers?box=incoming', { token }).catch(() => []),
      apiFetch<ChatOffer[]>('/offers?box=outgoing', { token }).catch(() => []),
      apiFetch<Product[]>('/products?mine=true', { token }).catch(() => []),
      apiFetch<MatchesResponse>('/matches', { token }).catch(() => null),
    ]);
    incoming = Array.isArray(inRes) ? inRes : [];
    outgoing = Array.isArray(outRes) ? outRes : [];
    myProducts = Array.isArray(prodRes) ? prodRes : [];
    matchesData = matchRes ?? null;
  } catch {
    /* empty — dashboard still renders */
  }

  // Recent chats
  const allChats = [...incoming, ...outgoing].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const recentChats = allChats.slice(0, 3);
  const pendingIncoming = incoming.filter((o) => o.status === 'PENDING').length;
  const totalChats = allChats.length;

  // Products split
  const availableProducts = myProducts.filter((p) => p.status === 'AVAILABLE');
  const pendingProducts = myProducts.filter((p) => p.status === 'PENDING');
  const recentProducts = myProducts
    .slice()
    .sort((a, b) => (a.title > b.title ? 1 : -1))
    .slice(0, 6);

  // Matches count for the quick action badge
  const matchesCount = matchesData
    ? (matchesData.matches?.length ?? 0) + (matchesData.hiddenCount ?? 0)
    : 0;

  return (
    <main className="min-h-screen bg-[#f9fbfa]">
      {/* ── Top nav ── */}
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

          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/matches" icon="🎯">
              Matches
            </NavLink>
            <NavLink href="/browse" icon="📋">
              Browse
            </NavLink>
            <NavLink href="/chat" icon="💬" badge={pendingIncoming}>
              Chats
            </NavLink>
            <NavLink href="/pricing" icon="⭐">
              Pricing
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} image={user.image} size={36} />
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {upgraded && <DashboardSuccessBanner />}

        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-ink leading-tight">
                  Welcome, {user.name?.split(' ')[0] || user.email.split('@')[0]}
                </h1>
                <TierBadge mode={status.mode} />
              </div>
              <p className="text-ink-muted text-sm">{greetingLine(status)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/post"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-5 py-3 rounded-full transition shadow-sm"
              >
                <span className="text-lg leading-none">+</span>
                Post request
              </Link>
              <Link
                href="/product/new"
                className="inline-flex items-center gap-2 bg-white border-2 border-border hover:border-primary/40 text-ink font-bold px-5 py-3 rounded-full transition"
              >
                <span className="text-lg leading-none">📦</span>
                List product
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ⭐ MATCHES — the reason users come back
        ═══════════════════════════════════════════ */}
        <DashboardMatchesSection
          token={token}
          myProductsCount={myProducts.length}
        />

        {/* ═══════════════════════════════════════════
            MAIN GRID — posting status + account
        ═══════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PostingStatusPanel status={status} />
          </div>

          <div className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider">
                Account
              </h2>
              <Link
                href="/profile"
                className="text-xs font-bold text-primary hover:underline"
              >
                Manage →
              </Link>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Email" value={user.email} truncate />
              <Row label="Tier" value={status.mode} bold />
              <Row
                label="Credits"
                value={`${user.creditsRemaining} posts`}
                bold
              />
              <Row label="Total posted" value={String(user.totalPostsMade)} />
              <Row
                label="Listings"
                value={`${availableProducts.length} active${
                  pendingProducts.length > 0
                    ? ` · ${pendingProducts.length} pending`
                    : ''
                }`}
              />
              <Row
                label="Matches"
                value={`${matchesCount} found`}
                bold
              />
              {user.telegramChatId && (
                <div className="flex items-center justify-between pt-3 border-t border-divider">
                  <span className="text-ink-muted text-xs">Telegram</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                    ✓ Linked
                  </span>
                </div>
              )}
            </div>

            <Link
              href={paid ? '/upgrade' : '/pricing'}
              className="mt-5 block text-center bg-primary-light text-primary hover:bg-primary hover:text-white font-bold py-2.5 rounded-xl text-sm transition"
            >
              {paid ? 'Top up plan' : 'Upgrade plan'}
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            YOUR LISTINGS
        ═══════════════════════════════════════════ */}
        <section className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <h2 className="text-base font-black text-ink">Your listings</h2>
              {availableProducts.length > 0 && (
                <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {availableProducts.length}
                </span>
              )}
              {pendingProducts.length > 0 && (
                <span className="bg-yellow-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingProducts.length} pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {myProducts.length > 0 && (
                <Link
                  href="/products"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View all ({myProducts.length}) →
                </Link>
              )}
              <Link
                href="/product/new"
                className="text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-full transition"
              >
                + List
              </Link>
            </div>
          </div>

          {myProducts.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-sm font-bold text-ink mb-1">
                You haven&apos;t listed any products yet
              </p>
              <p className="text-xs text-ink-muted mb-4 max-w-sm mx-auto">
                List something you want to trade — buyers find you, offers
                come in, and you choose what to accept.
              </p>
              <Link
                href="/product/new"
                className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition"
              >
                List your first product
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {recentProducts.map((p) => (
                <ProductMiniCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            RECENT CHATS
        ═══════════════════════════════════════════ */}
        <section className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <h2 className="text-base font-black text-ink">Recent chats</h2>
              {pendingIncoming > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingIncoming} new
                </span>
              )}
            </div>
            {totalChats > 0 && (
              <Link
                href="/chat"
                className="text-xs font-bold text-primary hover:underline"
              >
                View all ({totalChats}) →
              </Link>
            )}
          </div>

          {recentChats.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">💭</div>
              <p className="text-sm font-bold text-ink mb-1">
                No conversations yet
              </p>
              <p className="text-xs text-ink-muted mb-4 max-w-sm mx-auto">
                Chats open automatically when you send or receive a barter
                offer. List a product or send an offer to start talking.
              </p>
              <Link
                href="/browse"
                className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition"
              >
                Browse the board
              </Link>
            </div>
          ) : (
            <div>
              {recentChats.map((offer) => {
                const other = otherParty(offer, user.id);
                const product = subjectProduct(offer, user.id);
                const isIncoming = offer.receiverId === user.id;
                const isPending = offer.status === 'PENDING';

                return (
                  <Link
                    key={offer.id}
                    href={`/chat/${offer.id}`}
                    className="flex items-start gap-3 px-6 py-4 border-b border-divider last:border-b-0 hover:bg-primary-light/30 transition"
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        name={other.name}
                        image={other.image}
                        size={44}
                      />
                      {isPending && isIncoming && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-ink text-sm truncate">
                          {other.name || 'Barter User'}
                        </span>
                        <span className="text-[10px] text-ink-subtle flex-shrink-0">
                          {timeAgo(offer.updatedAt)}
                        </span>
                      </div>

                      {product && (
                        <div className="text-[11px] text-primary font-semibold truncate mb-1">
                          {isIncoming ? 'They offered' : 'You offered'} ·{' '}
                          {product.title}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-ink-muted truncate">
                          {offer.message?.trim() || 'No initial message'}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusBadgeClass(offer.status)}`}
                        >
                          {statusLabel(offer.status)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            QUICK ACTIONS — 6 cards
        ═══════════════════════════════════════════ */}
        <section>
          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">
            Quick actions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <ActionCard
              href="/post"
              emoji="📝"
              title="Post request"
              subtitle="Ask for what you need"
              accent
            />
            <ActionCard
              href="/product/new"
              emoji="📦"
              title="List product"
              subtitle="Offer something to trade"
            />
            <ActionCard
              href="/matches"
              emoji="🎯"
              title="Matches"
              subtitle={
                matchesCount > 0
                  ? `${matchesCount} product${matchesCount === 1 ? '' : 's'} found`
                  : 'See what fits'
              }
              badge={matchesCount}
            />
            <ActionCard
              href="/browse"
              emoji="📋"
              title="Browse board"
              subtitle="See open requests"
            />
            <ActionCard
              href="/chat"
              emoji="💬"
              title="Your chats"
              subtitle={
                totalChats > 0
                  ? `${totalChats} conversation${totalChats === 1 ? '' : 's'}`
                  : 'Talk to traders'
              }
              badge={pendingIncoming}
            />
            <ActionCard
              href={paid ? '/upgrade' : '/pricing'}
              emoji="⭐"
              title={paid ? 'Top up' : 'Upgrade'}
              subtitle={paid ? 'Extend your plan' : 'Unlock more posts'}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════
//  SUBCOMPONENTS
// ═══════════════════════════════════════════════════════

function ProductMiniCard({ product }: { product: Product }) {
  const statusColor =
    product.status === 'AVAILABLE'
      ? 'bg-green-100 text-green-800'
      : product.status === 'PENDING'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-gray-100 text-gray-700';

  return (
    <Link
      href={`/product/${product.id}`}
      className="block bg-white border border-border rounded-xl p-3 hover:border-primary/40 hover:shadow-sm transition"
    >
      <div className="flex gap-3">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0 text-xl">
            📦
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-bold text-ink truncate">
              {product.title}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusColor}`}
            >
              {product.status}
            </span>
          </div>
          <div className="text-[10px] text-ink-muted truncate">
            {product.category?.icon || '📦'} {product.category?.name || '—'}
          </div>
          <div className="text-[10px] font-bold text-primary mt-0.5">
            {product.estimatedValue?.toLocaleString()} ETB
          </div>
        </div>
      </div>
    </Link>
  );
}

function NavLink({
  href,
  icon,
  badge,
  children,
}: {
  href: string;
  icon: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink-muted hover:text-primary hover:bg-primary-light/40 transition"
    >
      <span>{icon}</span>
      <span>{children}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

function TierBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-700',
    DAILY: 'bg-blue-100 text-blue-800',
    CREDIT: 'bg-purple-100 text-purple-800',
    PRO: 'bg-primary text-white',
  };
  return (
    <span
      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${styles[mode] ?? styles.FREE}`}
    >
      {mode}
    </span>
  );
}

function greetingLine(status: ReturnType<typeof computePostingStatus>): string {
  if (status.mode === 'PRO') {
    return `PRO active · ${status.budgetLeft ?? 0} posts remaining · ${status.proDaysLeft ?? 0} days left`;
  }
  if (status.mode === 'DAILY') {
    return `Daily pass · ${status.postsLeftToday} posts left today`;
  }
  if (status.mode === 'CREDIT') {
    return `Credit pack · ${status.creditsRemaining} posts remaining`;
  }
  return status.canPost
    ? `You can post ${status.postsLeftToday} more today on the free plan`
    : 'Free plan limit reached — upgrade to keep posting';
}

function Row({
  label,
  value,
  bold,
  truncate,
}: {
  label: string;
  value: string;
  bold?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted text-xs flex-shrink-0">{label}</span>
      <span
        className={`text-right ${bold ? 'font-bold' : 'font-medium'} text-ink ${
          truncate ? 'truncate max-w-[140px]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  href,
  emoji,
  title,
  subtitle,
  accent,
  badge,
}: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative block rounded-2xl p-5 transition ${
        accent
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'bg-white border border-border hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="text-2xl mb-2">{emoji}</div>
      <div
        className={`font-bold mb-0.5 ${accent ? 'text-white' : 'text-ink'}`}
      >
        {title}
      </div>
      <div
        className={`text-xs ${accent ? 'text-white/80' : 'text-ink-muted'}`}
      >
        {subtitle}
      </div>
    </Link>
  );
}