import Link from 'next/link';
import { Suspense } from 'react';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to Barter Ethio to post, browse, and trade.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* ═══════════════════════════════════════════
          LEFT — Brand panel (desktop only)
      ═══════════════════════════════════════════ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-white p-12">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-32 w-96 h-96 bg-white rounded-full blur-[120px]" />
          <div className="absolute bottom-0 -right-32 w-96 h-96 bg-primary-mid rounded-full blur-[120px]" />
        </div>

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <span className="text-primary font-black text-xl leading-none">B</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Barter<span className="text-white/80">Ethio</span>
            </span>
          </Link>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight mb-6 max-w-md">
            Trade what you have
            <br />
            for what you{' '}
            <span className="text-primary-mid">actually want</span>.
          </h1>

          <p className="text-base xl:text-lg text-white/75 leading-relaxed max-w-sm mb-10">
            Ethiopia's modern barter platform. No cash required — just
            straight swaps with people in your area.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            <Feature emoji="🎯" text="Smart AI matches — find who wants what you have" />
            <Feature emoji="💬" text="Chat, negotiate, and finalize deals in-app" />
            <Feature emoji="📍" text="Local-first — trade with people nearby" />
            <Feature emoji="🔄" text="Barter or buy — your choice, every time" />
          </div>
        </div>

        {/* Footer stats */}
        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/15">
          <Stat value="10K+" label="Items listed" />
          <Stat value="5K+" label="Active traders" />
          <Stat value="3.2K" label="Successful swaps" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT — Sign-in form
      ═══════════════════════════════════════════ */}
      <div className="flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile-only header with back + brand */}
        <div className="lg:hidden border-b border-border">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-black text-base">B</span>
              </div>
              <span className="font-extrabold text-ink text-sm">
                Barter<span className="text-primary">Ethio</span>
              </span>
            </Link>
            <Link
              href="/browse"
              className="text-xs font-semibold text-ink-muted hover:text-primary"
            >
              Browse
            </Link>
          </div>
        </div>

        {/* Main form area */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
          <div className="w-full max-w-[400px]">
            {/* Mobile-only welcome */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
                <span className="text-white font-black text-2xl">B</span>
              </div>
              <h1 className="text-2xl font-black text-ink mb-1.5">
                Welcome to Barter Ethio
              </h1>
              <p className="text-sm text-ink-muted">
                Trade what you have for what you want.
              </p>
            </div>

            {/* Desktop-only heading */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-black text-ink mb-2 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-ink-muted">
                Sign in to post, browse, and trade.
              </p>
            </div>

            {/* Sign-in card */}
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              {/* Trust chip */}
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full mb-5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                Free forever · No credit card
              </div>

              <Suspense
                fallback={
                  <div className="h-[52px] rounded-full bg-primary-light animate-pulse" />
                }
              >
                <div className="flex justify-center">
                  <GoogleSignInButton />
                </div>
              </Suspense>

              {/* Divider with "or" */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                  <span className="bg-white px-3 text-ink-subtle">
                    What you get
                  </span>
                </div>
              </div>

              {/* Quick benefits */}
              <ul className="space-y-2.5">
                <Benefit>Post unlimited items to trade</Benefit>
                <Benefit>Get AI-matched with eager traders</Benefit>
                <Benefit>Chat securely with people nearby</Benefit>
                <Benefit>Works on mobile and web</Benefit>
              </ul>
            </div>

            {/* Terms */}
            <p className="text-[11px] text-ink-subtle text-center mt-6 leading-relaxed px-4">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary font-semibold hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Mobile trust row */}
            <div className="lg:hidden mt-8 flex items-center justify-center gap-5 text-[10px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure login
              </span>
              <span className="inline-flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Privacy first
              </span>
            </div>
          </div>
        </div>

        {/* Desktop footer */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-t border-border text-[11px] text-ink-muted">
          <span>© {new Date().getFullYear()} Barter Ethio</span>
          <span>Made in Ethiopia 🇪🇹</span>
        </div>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════
//  SUBCOMPONENTS
// ═══════════════════════════════════════════════════════

function Feature({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center text-sm">
        {emoji}
      </div>
      <span className="text-sm text-white/85 leading-relaxed pt-1">{text}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-black text-white leading-none mb-1">
        {value}
      </div>
      <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px] text-ink-muted leading-relaxed">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-primary flex-shrink-0 mt-[1px]"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}