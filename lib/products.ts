// ── My product (from /products?mine=true) ──
export type MyProduct = {
  id: string;
  title: string;
  description: string;
  images: string[];
  estimatedValue: number;
  condition: string;
  status: 'AVAILABLE' | 'PENDING' | 'SWAPPED';
  createdAt: string;
  category?: { id: string; name: string; icon: string | null; slug: string };
  wants?: Array<{
    categoryId: string;
    keywords: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    category?: { id: string; name: string; icon: string | null };
  }>;
};
