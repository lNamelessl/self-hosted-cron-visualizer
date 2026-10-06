export interface ShareState {
  expr: string;
  tz?: string;
  count?: number;
  /** optional frozen "now" (ISO) for deterministic, shareable results */
  now?: string;
}

export const DEFAULT_EXPR = '*/15 9-17 * * 1-5';

export function encodeShare(s: ShareState): string {
  const p = new URLSearchParams();
  p.set('expr', s.expr);
  if (s.tz) p.set('tz', s.tz);
  if (s.count && s.count !== 10) p.set('count', String(s.count));
  if (s.now) p.set('now', s.now);
  return `#/${p.toString()}`;
}

export function decodeShare(hash: string): ShareState | null {
  if (!hash || !hash.startsWith('#/')) return null;
  const qs = hash.slice(2);
  if (!qs) return null;
  const p = new URLSearchParams(qs);
  const expr = p.get('expr');
  if (!expr) return null;
  return {
    expr,
    tz: p.get('tz') || undefined,
    count: p.get('count') ? Math.min(50, Math.max(1, parseInt(p.get('count') || '10', 10) || 10)) : undefined,
    now: p.get('now') || undefined,
  };
}

/** Sync the URL hash (replaceState — no history spam, no hashchange loop). */
export function writeShare(s: ShareState): void {
  try {
    history.replaceState(null, '', encodeShare(s));
  } catch {
    /* ignore (e.g. sandboxed iframe) */
  }
}
