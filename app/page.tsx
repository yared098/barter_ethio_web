import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
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
            <Link
              href="/browse"
              className="text-sm font-semibold text-ink-muted hover:text-primary transition"
            >
              Browse
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-full transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light border border-primary/20 rounded-full px-3 py-1.5 text-xs font-bold text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Now live in Ethiopia · አማርኛ
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Trade what you have
            <br />
            for what you <span className="text-primary">actually want</span>.
          </h1>
          <p className="mt-6 text-lg text-ink-muted leading-relaxed max-w-xl mx-auto">
            Barter Ethio connects people who want to swap — no cash required.
            Post an item, discover smart matches, and barter directly.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3.5 rounded-full transition"
            >
              Browse the wanted board
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center bg-white border-2 border-border hover:border-primary/40 text-ink font-bold px-6 py-3.5 rounded-full transition"
            >
              Sign in with Google
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 bg-gradient-to-b from-white to-primary-light/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🔍', title: 'Smart Match', desc: 'Find items that match what you want AND whose owner wants what you have.' },
              { icon: '🔄', title: 'Direct Barter', desc: 'Send offers, negotiate, and swap items with zero cash involved.' },
              { icon: '🎯', title: 'Live Auctions', desc: 'Not sure of a price? Let bidders decide — cash, barter, or either.' },
              { icon: '📣', title: 'Wanted Board', desc: "Post what you're looking for. Sellers come to you with offers." },
              { icon: '💳', title: 'Chapa Payments', desc: 'Pay with Telebirr, CBE, Awash, or card. Secure and instant.' },
              { icon: '🌐', title: 'Amharic + English', desc: 'Full localization. Switch anytime, the app remembers your choice.' },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-bold text-ink mb-1">{f.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ink text-white/70 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">
          © {new Date().getFullYear()} Barter Ethio · Made in Ethiopia 🇪🇹
        </div>
      </footer>
    </main>
  );
}