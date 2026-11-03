import Link from 'next/link';
import { resolveImage } from '@/lib/utils';
import { type TeaserMatch } from '@/lib/matches';

export function MatchTeaserCard({ teaser }: { teaser: TeaserMatch }) {
  const image = teaser.image ? resolveImage(teaser.image) : null;

  return (
    <Link
      href="/pricing"
      className="group block bg-white border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition relative"
    >
      {/* Blurred image */}
      <div className="relative aspect-square bg-primary-light overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Locked match"
            className="w-full h-full object-cover blur-lg scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
            📦
          </div>
        )}

        {/* Dark overlay + lock */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="drop-shadow-lg"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="text-white text-[10px] font-black uppercase tracking-wider drop-shadow">
              Locked
            </span>
          </div>
        </div>

        {/* Score still visible */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[11px] font-black px-2.5 py-1 rounded-full">
          {teaser.score}%
        </div>

        {/* Category visible */}
        {teaser.categoryName && (
          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur text-[10px] font-bold text-ink px-2 py-1 rounded-full">
            {teaser.categoryIcon || '📦'} {teaser.categoryName}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="h-2.5 bg-primary-light rounded w-3/4 mb-2" />
        <div className="h-2 bg-primary-light rounded w-1/2 mb-3" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-ink">
            ~{teaser.estimatedValue?.toLocaleString() ?? '?'} ETB
          </span>
          <span className="text-[10px] font-black text-primary uppercase">
            Unlock →
          </span>
        </div>
      </div>
    </Link>
  );
}