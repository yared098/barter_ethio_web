import Link from 'next/link';

type Props = {
  active: 'home' | 'browse';
  pendingChats?: number;
};

const links = [
  { href: '/dashboard', label: 'Home', icon: 'home' },
  { href: '/products', label: 'Listings', icon: 'listings' },
  { href: '/matches', label: 'Matches', icon: 'matches' },
  { href: '/browse', label: 'Browse', icon: 'browse' },
  { href: '/chat', label: 'Chats', icon: 'chats' },
] as const;

export function MobilePrimaryNav({ active, pendingChats = 0 }: Props) {
  return (
    <div
      role="navigation"
      aria-label="Main navigation"
      className="grid grid-cols-5 border-t border-slate-200/70 bg-white/95 px-1 py-1.5 backdrop-blur-xl md:hidden"
    >
      {links.map((link) => {
        const isActive =
          (active === 'home' && link.href === '/dashboard') ||
          (active === 'browse' && link.href === '/browse');

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
              isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span className="relative">
              <NavIcon name={link.icon} />
              {link.href === '/chat' && pendingChats > 0 && (
                <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4 text-white">
                  {pendingChats > 9 ? '9+' : pendingChats}
                </span>
              )}
            </span>
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function NavIcon({ name }: { name: (typeof links)[number]['icon'] }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9M9 20v-6h6v6" />
        </svg>
      );
    case 'listings':
      return (
        <svg {...common}>
          <path d="M4 5h16M4 12h16M4 19h16" />
          <circle cx="2.5" cy="5" r=".5" fill="currentColor" />
          <circle cx="2.5" cy="12" r=".5" fill="currentColor" />
          <circle cx="2.5" cy="19" r=".5" fill="currentColor" />
        </svg>
      );
    case 'matches':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case 'browse':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4M11 7v8M7 11h8" />
        </svg>
      );
    case 'chats':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
      );
  }
}
