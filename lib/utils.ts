export function formatETB(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toLocaleString('en-US')} ETB`;
}

export function formatBudget(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${formatETB(min)} – ${formatETB(max)}`;
  if (min != null) return `${formatETB(min)}+`;
  if (max != null) return `up to ${formatETB(max)}`;
  return 'Open budget';
}

export function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function resolveImage(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://api.smrestaurant.com';
  const baseUrl = new URL(siteUrl).origin;
  return new URL(path, `${baseUrl}/`).toString();
}