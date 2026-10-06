import { CronExpressionParser } from 'cron-parser';
import { DateTime } from 'luxon';
import { errText } from './parse';

export interface RunItem {
  /** absolute instant */
  date: Date;
  /** wall-clock rendering in the selected timezone, e.g. "Fri, Oct 30, 2026, 12:15 PM" */
  wall: string;
  /** UTC offset label in that timezone at that instant, e.g. "GMT-4" */
  offset: string;
}

export interface NextRuns {
  runs: RunItem[];
  /** true when the list spans a DST transition (offset changes within the window) */
  dstTransition: boolean;
}

const wallFormatter = new Map<string, Intl.DateTimeFormat>();
const offsetFormatter = new Map<string, Intl.DateTimeFormat>();

function wallFmt(tz: string): Intl.DateTimeFormat {
  let f = wallFormatter.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    wallFormatter.set(tz, f);
  }
  return f;
}

function offsetFmt(tz: string): Intl.DateTimeFormat {
  let f = offsetFormatter.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
    offsetFormatter.set(tz, f);
  }
  return f;
}

function offsetOf(d: Date, tz: string): string {
  const part = offsetFmt(tz).formatToParts(d).find((p) => p.type === 'timeZoneName');
  return part ? part.value.replace('GMT', 'UTC') : '';
}

/**
 * Compute the next `count` runs of a canonical 5-field expression in the given IANA
 * timezone. cron-parser v5 delegates to luxon, which uses the runtime's Intl IANA
 * database — DST folds (1:00–1:59 happening twice in fall) are emitted twice with
 * different offsets, exactly like a real Vixie cron would fire; non-existent spring-
 * forward times shift forward (2:00 -> 3:00). No network access, no bundled tz db.
 *
 * `now` (optional) freezes "now" for deterministic, shareable results. Naive ISO
 * strings (no offset) are interpreted IN THE SELECTED timezone.
 */
export function computeNextRuns(normalized: string, tz: string, count: number, now?: string | null): NextRuns {
  let currentDate: Date | undefined;
  if (now) {
    const dt = DateTime.fromISO(now, { zone: tz });
    if (!dt.isValid) throw new Error(`Invalid "now" value: ${now}`);
    currentDate = dt.toJSDate();
  }

  let iterator: ReturnType<typeof CronExpressionParser.parse>;
  try {
    iterator = CronExpressionParser.parse(normalized, { tz, currentDate });
  } catch (e) {
    throw new Error(errText(e));
  }

  const runs: RunItem[] = [];
  let lastOffset: string | null = null;
  let dstTransition = false;
  for (let i = 0; i < count; i++) {
    const d = iterator.next().toDate();
    const offset = offsetOf(d, tz);
    if (lastOffset !== null && offset !== lastOffset) dstTransition = true;
    lastOffset = offset;
    runs.push({ date: d, wall: wallFmt(tz).format(d), offset });
  }
  return { runs, dstTransition };
}

/** One-line export format for the copy button: "Fri, Oct 30 2026, 12:15 PM (UTC-4)" */
export function formatRunLine(r: RunItem, tz: string): string {
  return `${r.wall} (${r.offset}) — ${tz}`;
}
