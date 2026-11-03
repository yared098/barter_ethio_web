import Link from 'next/link';
import { resolveImage } from '@/lib/utils';
import { type Match, scoreColor, scoreLabel } from '@/lib/matches';

export function MatchCard({ match }: { match: Match }) {
  const { product, score, reasons, aiRanked } = match;
  const color = scoreColor(score);
  const image = product.images?.[0] ? resolveImage(product.images[0]) : null;
  const topReason = reasons?.[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-white border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition"
    >
      {/* Image */}
      <div className="relative aspect-square bg-primary-light overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📦
          </div>
        )}

        {/* Score badge */}
        <div
          className={`absolute top-2 right-2 ${color.bg} ${color.text} text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm`}
        >
          {score}%
        </div>

        {/* AI badge */}
        {aiRanked && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            ⚡ AI
          </div>
        )}

        {/* Category chip */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur text-[10px] font-bold text-ink px-2 py-1 rounded-full">
          {product.category?.icon || '📦'} {product.category?.name || '—'}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-ink line-clamp-2 leading-snug mb-1">
          {product.title}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-black text-primary">
            {product.estimatedValue?.toLocaleString()} ETB
          </span>
          <span className="text-[10px] font-semibold text-ink-muted">
            {product.condition}
          </span>
        </div>

        {topReason && (
          <div className="text-[11px] text-ink-muted leading-snug line-clamp-2 mb-2">
            💡 {topReason}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-divider">
          <span className="text-[10px] text-ink-subtle font-semibold truncate">
            {product.owner?.name || 'Barter User'}
          </span>
          <span
            className={`text-[9px] font-black uppercase tracking-wider ${color.text === 'text-white' ? 'text-primary' : 'text-ink-muted'}`}
          >
            {scoreLabel(score)}
          </span>
        </div>
      </div>
    </Link>
  );
}