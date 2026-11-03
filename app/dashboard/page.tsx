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

type SearchParams = {
  upgraded?: string;
  ltab?: 'all' | 'available' | 'pending';
  ctab?: 'all' | 'incoming' | 'outgoing';
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/dashboard');

  const sp = await searchParams;
  const upgraded = sp.upgraded === '1';
  const listingTab: NonNullable<SearchParams['ltab']> = sp.ltab ?? 'all';
  const chatTab: NonNullable<SearchParams['ctab']> = sp.ctab ?? 'all';

  const status = computePostingStatus(user);
  const paid = hasPaidAccess(user);
  const token = await getAccessToken();

  // ── Parallel fetch ──
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

  const allChats = [...incoming, ...outgoing].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const recentChats = allChats.slice(0, 5);
  const pendingIncoming = incoming.filter((o) => o.status === 'PENDING').length;
  const totalChats = allChats.length;

  const availableProducts = myProducts.filter((p) => p.status === 'AVAILABLE');
  const pendingProducts = myProducts.filter((p) => p.status === 'PENDING');
  const recentProducts = myProducts
    .slice()
    .sort((a, b) => (a.title > b.title ? 1 : -1))
    .slice(0, 6);

  // Tab filters
  const filteredChats =
    chatTab === 'incoming'
      ? recentChats.filter((o) => o.receiverId === user.id)
      : chatTab === 'outgoing'
        ? recentChats.filter((o) => o.senderId === user.id)
        : recentChats;

  const filteredProducts =
    listingTab === 'available'
      ? recentProducts.filter((p) => p.status === 'AVAILABLE')
      : listingTab === 'pending'
        ? recentProducts.filter((p) => p.status === 'PENDING')
        : recentProducts;

  const matchesCount = matchesData
    ? (matchesData.matches?.length ?? 0) + (matchesData.hiddenCount ?? 0)
    : 0;

  const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];

  return (
    <main className="min-h-screen bg-[#f6f8fa]">
      {/* ═══════════ TOP NAV ═══════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-extrabold text-ink hidden sm:inline">
              Barter<span className="text-primary">Ethio</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5 bg-slate-100/60 p-1 rounded-full">
            <NavPill href="/matches" icon="🎯">
              Matches
            </NavPill>
            <NavPill href="/browse" icon="📋">
              Browse
            </NavPill>
            <NavPill href="/chat" icon="💬" badge={pendingIncoming}>
              Chats
            </NavPill>
            <NavPill href="/pricing" icon="⭐">
              Pricing
            </NavPill>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <UserAvatar name={user.name} image={user.image} size={34} />
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {upgraded && <DashboardSuccessBanner />}

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark p-6 sm:p-8 mb-8 text-white shadow-xl shadow-primary/20">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-white/30" />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-white/20" />

          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <TierBadge mode={status.mode} onDark />
                {matchesCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    🎯 {matchesCount} {matchesCount === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-2">
                Welcome back, {firstName} <span className="opacity-90">👋</span>
              </h1>
              <p className="text-white/80 text-sm leading-relaxed max-w-lg">
                {greetingLine(status)}
              </p>

              {/* Inline stats */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-5">
                <StatChip
                  icon="🎯"
                  label="Matches"
                  value={matchesCount}
                  highlight={matchesCount > 0}
                />
                <StatChip
                  icon="💬"
                  label="Pending chats"
                  value={pendingIncoming}
                  highlight={pendingIncoming > 0}
                />
                <StatChip
                  icon="📦"
                  label="Active listings"
                  value={availableProducts.length}
                />
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
              <Link
                href="/post"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-slate-50 font-bold px-5 py-3 rounded-xl transition shadow-sm hover:shadow active:scale-[0.98]"
              >
                <span className="text-lg leading-none">+</span>
                Post request
              </Link>
              <Link
                href="/product/new"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/25 text-white hover:bg-white/20 font-bold px-5 py-3 rounded-xl transition active:scale-[0.98]"
              >
                <span className="text-lg leading-none">📦</span>
                List product
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════ MATCHES ═══════════ */}
        <DashboardMatchesSection
          token={token}
          myProductsCount={myProducts.length}
        />

        {/* ═══════════ STATUS + ACCOUNT ═══════════ */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PostingStatusPanel status={status} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-600"
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-slate-900">Account</h2>
              </div>
              <Link
                href="/profile"
                className="text-xs font-bold text-primary hover:underline"
              >
                Manage →
              </Link>
            </div>

            <div className="p-5 space-y-3.5 text-sm">
              <Row label="Email" value={user.email} truncate />
              <Row label="Plan" value={status.mode} bold />
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
              <Row label="Matches" value={`${matchesCount} found`} bold />
              {user.telegramChatId && (
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <span className="text-slate-500 text-xs">Telegram</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Linked
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 pt-0">
              <Link
                href={paid ? '/upgrade' : '/pricing'}
                className="block text-center bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-2.5 rounded-xl text-sm hover:shadow-md transition active:scale-[0.98]"
              >
                {paid ? 'Top up plan' : 'Upgrade plan'}
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════ YOUR LISTINGS ═══════════ */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-base">📦</span>
                </div>
                <h2 className="text-base font-black text-slate-900 truncate">
                  Your listings
                </h2>
                {myProducts.length > 0 && (
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                    {myProducts.length}
                  </span>
                )}
              </div>
              <Link
                href="/product/new"
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-full transition shrink-0"
              >
                + List
              </Link>
            </div>

            {myProducts.length > 0 && (
              <div className="flex items-center gap-1 -mb-1 overflow-x-auto no-scrollbar">
                <TabLink
                  href={`/dashboard?ltab=all${upgraded ? '&upgraded=1' : ''}`}
                  active={listingTab === 'all'}
                  label="All"
                  count={myProducts.length}
                />
                <TabLink
                  href={`/dashboard?ltab=available${upgraded ? '&upgraded=1' : ''}`}
                  active={listingTab === 'available'}
                  label="Available"
                  count={availableProducts.length}
                />
                <TabLink
                  href={`/dashboard?ltab=pending${upgraded ? '&upgraded=1' : ''}`}
                  active={listingTab === 'pending'}
                  label="Pending"
                  count={pendingProducts.length}
                />
              </div>
            )}
          </div>

          {myProducts.length === 0 ? (
            <EmptyState
              icon="📦"
              title="You haven't listed any products yet"
              description="List something you want to trade — buyers find you, offers come in, and you choose what to accept."
              ctaHref="/product/new"
              ctaLabel="List your first product"
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Nothing here"
              description={`No products in "${listingTab}" right now.`}
              ctaHref="/dashboard?ltab=all"
              ctaLabel="See all listings"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-5">
              {filteredProducts.map((p) => (
                <ProductMiniCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════ RECENT CHATS ═══════════ */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-base">💬</span>
                </div>
                <h2 className="text-base font-black text-slate-900 truncate">
                  Recent chats
                </h2>
                {pendingIncoming > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                    {pendingIncoming} new
                  </span>
                )}
              </div>
              {totalChats > 0 && (
                <Link
                  href="/chat"
                  className="text-xs font-bold text-primary hover:underline shrink-0"
                >
                  View all ({totalChats}) →
                </Link>
              )}
            </div>

            {totalChats > 0 && (
              <div className="flex items-center gap-1 -mb-1 overflow-x-auto no-scrollbar">
                <TabLink
                  href={`/dashboard?ctab=all${upgraded ? '&upgraded=1' : ''}`}
                  active={chatTab === 'all'}
                  label="All"
                  count={totalChats}
                />
                <TabLink
                  href={`/dashboard?ctab=incoming${upgraded ? '&upgraded=1' : ''}`}
                  active={chatTab === 'incoming'}
                  label="Incoming"
                  count={incoming.length}
                />
                <TabLink
                  href={`/dashboard?ctab=outgoing${upgraded ? '&upgraded=1' : ''}`}
                  active={chatTab === 'outgoing'}
                  label="Outgoing"
                  count={outgoing.length}
                />
              </div>
            )}
          </div>

          {totalChats === 0 ? (
            <EmptyState
              icon="💭"
              title="No conversations yet"
              description="Chats open automatically when you send or receive a barter offer. List a product or send an offer to start talking."
              ctaHref="/browse"
              ctaLabel="Browse the board"
            />
          ) : filteredChats.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Nothing here"
              description={`No ${chatTab} chats yet.`}
              ctaHref="/dashboard?ctab=all"
              ctaLabel="See all chats"
            />
          ) : (
            <div>
              {filteredChats.map((offer) => {
                const other = otherParty(offer, user.id);
                const product = subjectProduct(offer, user.id);
                const isIncoming = offer.receiverId === user.id;
                const isPending = offer.status === 'PENDING';

                return (
                  <Link
                    key={offer.id}
                    href={`/chat/${offer.id}`}
                    className="group flex items-start gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-primary/[0.03] transition"
                  >
                    <div className="relative shrink-0">
                      <UserAvatar
                        name={other.name}
                        image={other.image}
                        size={44}
                      />
                      {isPending && isIncoming && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-slate-900 text-sm truncate group-hover:text-primary transition">
                          {other.name || 'Barter User'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
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
                        <span className="text-xs text-slate-500 truncate">
                          {offer.message?.trim() || 'No initial message'}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${statusBadgeClass(
                            offer.status,
                          )}`}
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

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Quick actions
            </h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  ? `${matchesCount} found`
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
                  ? `${totalChats} chat${totalChats === 1 ? '' : 's'}`
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

function StatChip({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm transition ${
        highlight
          ? 'bg-white/20 border border-white/30'
          : 'bg-white/10 border border-white/15'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-black tabular-nums">{value}</span>
        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
      <span
        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums ${
          active ? 'bg-white/25' : 'bg-slate-200 text-slate-700'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-3xl">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-900 mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-full text-sm transition active:scale-[0.98]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function ProductMiniCard({ product }: { product: Product }) {
  const statusColor =
    product.status === 'AVAILABLE'
      ? 'bg-emerald-100 text-emerald-800'
      : product.status === 'PENDING'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-white border border-slate-200 rounded-xl p-3 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex gap-3">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-14 h-14 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xl">
            📦
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-bold text-slate-900 truncate group-hover:text-primary transition">
              {product.title}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusColor}`}
            >
              {product.status}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {product.category?.icon || '📦'} {product.category?.name || '—'}
          </div>
          <div className="text-[11px] font-black text-primary mt-0.5 tabular-nums">
            {product.estimatedValue?.toLocaleString()} ETB
          </div>
        </div>
      </div>
    </Link>
  );
}

function NavPill({
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
      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-600 hover:text-primary hover:bg-white transition"
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{children}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

function TierBadge({
  mode,
  onDark,
}: {
  mode: string;
  onDark?: boolean;
}) {
  const styles: Record<string, string> = onDark
    ? {
        FREE: 'bg-white/15 text-white border border-white/25',
        DAILY: 'bg-blue-400/25 text-white border border-blue-200/40',
        CREDIT: 'bg-purple-400/25 text-white border border-purple-200/40',
        PRO: 'bg-yellow-400/25 text-white border border-yellow-200/50',
      }
    : {
        FREE: 'bg-slate-100 text-slate-700',
        DAILY: 'bg-blue-100 text-blue-800',
        CREDIT: 'bg-purple-100 text-purple-800',
        PRO: 'bg-primary text-white',
      };
  return (
    <span
      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm ${
        styles[mode] ?? styles.FREE
      }`}
    >
      {mode}
    </span>
  );
}

function greetingLine(
  status: ReturnType<typeof computePostingStatus>,
): string {
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
      <span className="text-slate-500 text-xs shrink-0">{label}</span>
      <span
        className={`text-right ${bold ? 'font-bold' : 'font-medium'} text-slate-900 ${
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
      className={`group relative block rounded-2xl p-4 sm:p-5 transition-all hover:-translate-y-0.5 ${
        accent
          ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25'
          : 'bg-white border border-slate-200 hover:border-primary/40 hover:shadow-md'
      }`}
    >
      {badge != null && badge > 0 && (
        <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="text-2xl mb-2 transition-transform group-hover:scale-110 origin-left">
        {emoji}
      </div>
      <div
        className={`font-bold mb-0.5 text-sm ${
          accent ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </div>
      <div
        className={`text-[11px] leading-snug ${
          accent ? 'text-white/80' : 'text-slate-500'
        }`}
      >
        {subtitle}
      </div>
    </Link>
  );
}