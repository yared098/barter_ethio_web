export type MatchProduct = {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  condition: string;
  category: { id: string; name: string; icon: string | null };
  owner: { id: string; name: string | null; image: string | null };
};

export type Match = {
  product: MatchProduct;
  score: number;
  reasons: string[];
  wantsMatch?: { categoryId: string; keywords?: string | null };
  aiRanked?: boolean;
};

export type TeaserMatch = {
  id: string;
  image: string | null;
  score: number;
  categoryName: string | null;
  categoryIcon: string | null;
  estimatedValue: number | null;
  locked: true;
};

export type MatchesResponse = {
  matches: Match[];
  teaserMatches: TeaserMatch[];
  totalCount: number;
  hiddenCount: number;
  visibleLimit: number | null;
  tier: string;
  aiRanked: boolean;
  upgradeUrl: string | null;
};

/** Green/gold gradient by match quality */
export function scoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 90) {
    return {
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      text: 'text-white',
      border: 'border-emerald-500',
    };
  }
  if (score >= 75) {
    return {
      bg: 'bg-emerald-500',
      text: 'text-white',
      border: 'border-emerald-500',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-primary',
      text: 'text-white',
      border: 'border-primary',
    };
  }
  return {
    bg: 'bg-primary-mid',
    text: 'text-ink',
    border: 'border-primary/40',
  };
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Perfect match';
  if (score >= 75) return 'Great match';
  if (score >= 60) return 'Good match';
  return 'Possible match';
}