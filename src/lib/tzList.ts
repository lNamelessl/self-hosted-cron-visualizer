/** Timezone helpers. The IANA list comes from the runtime (Intl) — no bundled or fetched tz db. */

export const FAVORITES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const FALLBACK = FAVORITES.concat([
  'America/Sao_Paulo',
  'Africa/Cairo',
  'Africa/Lagos',
  'Asia/Hong_Kong',
  'Pacific/Auckland',
]);

export function allTimeZones(): string[] {
  try {
    const supported = Intl.supportedValuesOf('timeZone');
    if (supported && supported.length > 0) return supported;
  } catch {
    /* older runtime — fall back */
  }
  return FALLBACK;
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
