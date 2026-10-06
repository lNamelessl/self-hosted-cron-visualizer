/**
 * Expression normalization + validation, deliberately done BEFORE handing anything to
 * cron-parser/cronstrue:
 *  - cron-parser v5 leniently accepts 4-field expressions (`* * * *`) — crontab-style UX
 *    requires exactly 5 fields (or 6 with a leading seconds field).
 *  - @reboot is accepted by cronstrue ("Run once, at startup") but is not a schedulable
 *    time expression — it is surfaced as a distinct state, never fed to next-run math.
 *  - @midnight is NOT resolvable by cron-parser v5 ("cannot resolve alias") — it is
 *    normalized to 0 0 * * * (Vixie cron treats @midnight == @daily).
 */

export const REBOOT = '@reboot';

const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export const MACRO_LIST = Object.keys(MACROS).concat(REBOOT);

export interface ParsedOk {
  ok: true;
  /** raw, whitespace-collapsed input (what the user shares) */
  expr: string;
  /** canonical 5-field expression used for next-run math */
  normalized: string;
  hasSeconds: boolean;
  /** macro name if input was a macro, e.g. "@midnight" */
  macro: string | null;
  reboot: boolean;
}

export interface ParsedErr {
  ok: false;
  error: string;
}

export type Parsed = ParsedOk | ParsedErr;

/**
 * cronstrue throws plain STRINGS (not Error objects) — e.g. "Error: minutes part must be >= 0 and <= 59".
 * Normalize any throwable into a human message.
 */
export function errText(e: unknown): string {
  if (typeof e === 'string') return e.replace(/^Error:\s*/, '');
  if (e instanceof Error) return e.message;
  return String(e);
}

export function parseExpression(raw: string): Parsed {
  const expr = raw.trim().replace(/\s+/g, ' ');
  if (!expr) {
    return {
      ok: false,
      error: 'Enter a cron expression: minute hour day-of-month month day-of-week (e.g. */15 9-17 * * 1-5).',
    };
  }

  const lower = expr.toLowerCase();

  if (lower === REBOOT) {
    return { ok: true, expr, normalized: expr, hasSeconds: false, macro: REBOOT, reboot: true };
  }

  const macro = MACROS[lower];
  if (macro) {
    return { ok: true, expr, normalized: macro, hasSeconds: false, macro: lower, reboot: false };
  }

  if (lower.startsWith('@')) {
    return {
      ok: false,
      error: `Unknown macro "${expr}". Supported: ${MACRO_LIST.join(' ')}.`,
    };
  }

  const fields = expr.split(' ');
  const hasSeconds = fields.length === 6;
  if (fields.length !== 5 && fields.length !== 6) {
    return {
      ok: false,
      error: `Expected 5 fields (minute hour day month weekday) — got ${fields.length}. A leading seconds field (6 total) is also accepted.`,
    };
  }

  const five = hasSeconds ? fields.slice(1) : fields;
  const ranges: Array<[number, number, string]> = [
    [0, 59, 'minute'],
    [0, 23, 'hour'],
    [1, 31, 'day-of-month'],
    [1, 12, 'month'],
    [0, 7, 'day-of-week'],
  ];
  for (let i = 0; i < 5; i++) {
    const bad = plainNumberOutOfRange(five[i], ranges[i][0], ranges[i][1]);
    if (bad !== null) {
      return {
        ok: false,
        error: `Invalid ${ranges[i][2]} value "${bad}": must be between ${ranges[i][0]} and ${ranges[i][1]}.`,
      };
    }
  }

  return { ok: true, expr, normalized: expr, hasSeconds, macro: null, reboot: false };
}

/** Fast pre-check so the common typo (99 * * * *) gets a friendly message even before lib errors. */
function plainNumberOutOfRange(field: string, min: number, max: number): string | null {
  if (!/^\d+$/.test(field)) return null; // complex field — let the library validate
  const n = parseInt(field, 10);
  return n < min || n > max ? field : null;
}
