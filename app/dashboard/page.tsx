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
import { resolveImage } from '@/lib/utils';

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

  const tabHref = (key: 'ltab' | 'ctab', value: string) => {
    const params = new URLSearchParams();
    if (upgraded) params.set('upgraded', '1');
    const ltab = key === 'ltab' ? value : listingTab;
    const ctab = key === 'ctab' ? value : chatTab;
    if (ltab !== 'all') params.set('ltab', ltab);
    if (ctab !== 'all') params.set('ctab', ctab);
    const qs = params.toString();
    return `/dashboard${qs ? `?${qs}` : ''}`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ═══════════ TOP NAV ═══════════ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-bold text-slate-900 hidden sm:inline tracking-tight">
              Barter<span className="text-emerald-600">Ethio</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/matches">Matches</NavLink>
            <NavLink href="/browse">Browse</NavLink>
            <NavLink href="/chat" badge={pendingIncoming}>
              Chats
            </NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <UserAvatar name={user.name} image={user.image} size={34} />
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {upgraded && <DashboardSuccessBanner />}

        {/* ═══════════ HERO — lighter, cleaner ═══════════ */}
        <section className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <TierBadge mode={status.mode} />
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-500">
                  {greetingLine(status)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome back, {firstName}
              </h1>

              <div className="grid grid-cols-3 gap-3 mt-6 max-w-md">
                <StatCard
                  icon={<IconTarget />}
                  label="Matches"
                  value={matchesCount}
                  highlight={matchesCount > 0}
                  href="/matches"
                />
                <StatCard
                  icon={<IconMessage />}
                  label="Pending"
                  value={pendingIncoming}
                  highlight={pendingIncoming > 0}
                  href="/chat"
                />
                <StatCard
                  icon={<IconBox />}
                  label="Listings"
                  value={availableProducts.length}
                  href="/products"
                />
              </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
              <Link
                href="/post"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3 rounded-xl transition shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <IconPlus />
                Post request
              </Link>
              <Link
                href="/products"
                className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 rounded-xl transition active:scale-[0.98]"
              >
                <IconBox />
                My products
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
        <div className="grid lg:grid-cols-3 gap-5 mb-10">
          <div className="lg:col-span-2">
            <PostingStatusPanel status={status} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Account</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your profile & plan
                </p>
              </div>
              <Link
                href="/profile"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                Manage
              </Link>
            </div>

            <div className="px-5 pb-4 space-y-2.5 text-sm">
              <Row label="Email" value={user.email} truncate />
              <Row label="Plan" value={status.mode} bold />
              <Row label="Credits" value={`${user.creditsRemaining}`} bold />
              <Row label="Total posted" value={String(user.totalPostsMade)} />
              <Row
                label="Listings"
                value={`${availableProducts.length}${
                  pendingProducts.length > 0 ? ` · ${pendingProducts.length} pending` : ''
                }`}
              />
              <Row label="Matches" value={`${matchesCount}`} bold />
              {user.telegramChatId && (
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <span className="text-slate-500 text-xs">Telegram</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Linked
                  </span>
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <Link
                href={paid ? '/upgrade' : '/pricing'}
                className="block text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                {paid ? 'Top up plan' : 'Upgrade plan'}
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════ YOUR LISTINGS ═══════════ */}
        <Section
          icon={<IconBox />}
          title="Your listings"
          count={myProducts.length}
          actions={
            <>
              {myProducts.length > 0 && (
                <Link
                  href="/products"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
                >
                  View all →
                </Link>
              )}
              <Link
                href="/product/new"
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap"
              >
                <IconPlus size={12} />
                New
              </Link>
            </>
          }
          tabs={
            myProducts.length > 0
              ? [
                  { href: tabHref('ltab', 'all'), active: listingTab === 'all', label: 'All', count: myProducts.length },
                  { href: tabHref('ltab', 'available'), active: listingTab === 'available', label: 'Available', count: availableProducts.length },
                  { href: tabHref('ltab', 'pending'), active: listingTab === 'pending', label: 'Pending', count: pendingProducts.length },
                ]
              : undefined
          }
        >
          {myProducts.length === 0 ? (
            <EmptyState
              icon={<IconBox size={24} />}
              title="No products yet"
              description="List something you want to trade. Buyers find you, offers come in, and you choose what to accept."
              ctaHref="/product/new"
              ctaLabel="List your first product"
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={<IconSearch size={24} />}
              title={`No ${listingTab} products`}
              description="Try a different filter to see more of your listings."
              ctaHref={tabHref('ltab', 'all')}
              ctaLabel="See all listings"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-5">
              {filteredProducts.map((p) => (
                <ProductMiniCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </Section>

        {/* ═══════════ RECENT CHATS ═══════════ */}
        <Section
          icon={<IconMessage />}
          title="Recent chats"
          count={totalChats}
          badge={
            pendingIncoming > 0 ? (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {pendingIncoming} new
              </span>
            ) : undefined
          }
          actions={
            totalChats > 0 ? (
              <Link
                href="/chat"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
              >
                View all →
              </Link>
            ) : undefined
          }
          tabs={
            totalChats > 0
              ? [
                  { href: tabHref('ctab', 'all'), active: chatTab === 'all', label: 'All', count: totalChats },
                  { href: tabHref('ctab', 'incoming'), active: chatTab === 'incoming', label: 'Incoming', count: incoming.length },
                  { href: tabHref('ctab', 'outgoing'), active: chatTab === 'outgoing', label: 'Outgoing', count: outgoing.length },
                ]
              : undefined
          }
        >
          {totalChats === 0 ? (
            <EmptyState
              icon={<IconMessage size={24} />}
              title="No conversations yet"
              description="Chats open automatically when you send or receive a barter offer. Send one to start talking."
              ctaHref="/browse"
              ctaLabel="Browse the board"
            />
          ) : filteredChats.length === 0 ? (
            <EmptyState
              icon={<IconSearch size={24} />}
              title={`No ${chatTab} chats`}
              description="Try a different filter to see more of your conversations."
              ctaHref={tabHref('ctab', 'all')}
              ctaLabel="See all chats"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredChats.map((offer) => {
                const other = otherParty(offer, user.id);
                const product = subjectProduct(offer, user.id);
                const isIncoming = offer.receiverId === user.id;
                const isPending = offer.status === 'PENDING';

                return (
                  <Link
                    key={offer.id}
                    href={`/chat/${offer.id}`}
                    className="group flex items-start gap-3 px-5 sm:px-6 py-3.5 hover:bg-slate-50/80 transition"
                  >
                    <div className="relative shrink-0">
                      <UserAvatar name={other.name} image={other.image} size={42} />
                      {isPending && isIncoming && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {other.name || 'Barter User'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                          {timeAgo(offer.updatedAt)}
                        </span>
                      </div>

                      {product && (
                        <div className="text-[11px] text-emerald-600 font-medium truncate mb-1">
                          {isIncoming ? 'They offered' : 'You offered'} · {product.title}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 truncate">
                          {offer.message?.trim() || 'No initial message'}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${statusBadgeClass(offer.status)}`}
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
        </Section>

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <ActionCard
              href="/post"
              icon={<IconEdit />}
              title="Post request"
              subtitle="Ask for what you need"
              primary
            />
            <ActionCard
              href="/products"
              icon={<IconBox />}
              title="My products"
              subtitle="Manage your listings"
            />
            <ActionCard
              href="/matches"
              icon={<IconTarget />}
              title="Matches"
              subtitle={matchesCount > 0 ? `${matchesCount} found` : 'See what fits'}
              badge={matchesCount}
            />
            <ActionCard
              href="/browse"
              icon={<IconCompass />}
              title="Browse board"
              subtitle="See open requests"
            />
            <ActionCard
              href="/chat"
              icon={<IconMessage />}
              title="Your chats"
              subtitle={totalChats > 0 ? `${totalChats} chat${totalChats === 1 ? '' : 's'}` : 'Talk to traders'}
              badge={pendingIncoming}
            />
            <ActionCard
              href={paid ? '/upgrade' : '/pricing'}
              icon={<IconStar />}
              title={paid ? 'Top up' : 'Upgrade'}
              subtitle={paid ? 'Extend your plan' : 'Unlock more'}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════
//  SECTION WRAPPER — consistent card style
// ═══════════════════════════════════════════════════════

type Tab = { href: string; active: boolean; label: string; count: number };

function Section({
  icon,
  title,
  count,
  badge,
  actions,
  tabs,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: Tab[];
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
      <div className="px-5 sm:px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
              {icon}
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate">
              {title}
            </h2>
            {count != null && count > 0 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {count}
              </span>
            )}
            {badge}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>

        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 -mb-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <TabLink key={t.label} {...t} />
            ))}
          </div>
        )}
      </div>

      {children}
    </section>
  );
}

// ═══════════════════════════════════════════════════════
//  SUBCOMPONENTS
// ═══════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  highlight,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 hover:shadow-sm transition"
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${
          highlight ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {icon}
      </div>
      <div className="text-lg font-black text-slate-900 tabular-nums leading-tight">
        {value}
      </div>
      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </div>
    </Link>
  );
}

function TabLink({ href, active, label, count }: Tab) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
          active ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
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
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-900 mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function ProductMiniCard({ product }: { product: Product }) {
  const image = resolveImage(product.images?.[0]);
  const statusColor =
    product.status === 'AVAILABLE'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : product.status === 'PENDING'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div>
      <Link
        href="/products"
        title="View all your products"
        className="group block bg-white border border-slate-200 rounded-xl p-3 hover:border-emerald-300 hover:shadow-md transition-all"
      >
        <div className="flex gap-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.title}
              className="w-16 h-16 rounded-lg object-cover shrink-0 ring-1 ring-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
              <IconBox size={20} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition">
                {product.title}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate mb-1">
              {product.category?.name || 'Uncategorized'}
            </div>
            <div className="flex items-center justify-between gap-1">
              <div className="text-[11px] font-bold text-slate-900 tabular-nums">
                {product.estimatedValue?.toLocaleString()}{' '}
                <span className="text-[9px] font-medium text-slate-400">ETB</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}
              >
                {product.status === 'AVAILABLE' ? 'Live' : product.status === 'PENDING' ? 'In deal' : 'Swapped'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function NavLink({
  href,
  badge,
  children,
}: {
  href: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition"
    >
      <span>{children}</span>
      {badge != null && badge > 0 && (
        <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

function TierBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-slate-100 text-slate-700 border-slate-200',
    DAILY: 'bg-blue-50 text-blue-700 border-blue-200',
    CREDIT: 'bg-violet-50 text-violet-700 border-violet-200',
    PRO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border ${
        styles[mode] ?? styles.FREE
      }`}
    >
      {mode}
    </span>
  );
}

function greetingLine(status: ReturnType<typeof computePostingStatus>): string {
  if (status.mode === 'PRO') {
    return `PRO · ${status.budgetLeft ?? 0} posts · ${status.proDaysLeft ?? 0} days left`;
  }
  if (status.mode === 'DAILY') {
    return `Daily pass · ${status.postsLeftToday} left today`;
  }
  if (status.mode === 'CREDIT') {
    return `Credit pack · ${status.creditsRemaining} left`;
  }
  return status.canPost
    ? `${status.postsLeftToday} posts left today`
    : 'Free plan limit reached — upgrade to continue';
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
        className={`text-right text-xs ${bold ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} ${
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
  icon,
  title,
  subtitle,
  primary,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`group relative block rounded-xl p-4 transition-all hover:-translate-y-0.5 ${
        primary
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
          : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {badge != null && badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
          primary ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {icon}
      </div>
      <div
        className={`font-semibold text-sm mb-0.5 ${
          primary ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </div>
      <div
        className={`text-[11px] leading-snug ${
          primary ? 'text-white/80' : 'text-slate-500'
        }`}
      >
        {subtitle}
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════
//  SVG ICONS — consistent stroke style
// ═══════════════════════════════════════════════════════

function IconTarget({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconMessage({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconBox({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEdit({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconCompass({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconStar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
