export interface Preset {
  label: string;
  expr: string;
}

export const PRESETS: Preset[] = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *' },
  { label: 'Weekdays at 9 AM', expr: '0 9 * * 1-5' },
  { label: 'Monthly on the 1st', expr: '0 0 1 * *' },
];

export const MACRO_CHIPS = ['@hourly', '@daily', '@midnight', '@weekly', '@monthly', '@yearly', '@reboot'];

/** Builder state — each field has a mode + value; composed into a 5-field expression. */
export interface BuilderState {
  minuteMode: 'every' | 'step' | 'at';
  minuteStep: number;
  minuteAt: number;
  hourMode: 'every' | 'step' | 'range' | 'at';
  hourStep: number;
  hourFrom: number;
  hourTo: number;
  hourAt: number;
  dom: string; // '*' or 1-31
  month: string; // '*' or 1-12
  dowMode: 'every' | 'weekdays' | 'weekend' | 'at';
  dowAt: string; // '0'..'6'
}

export const DEFAULT_BUILDER: BuilderState = {
  minuteMode: 'every',
  minuteStep: 15,
  minuteAt: 0,
  hourMode: 'every',
  hourStep: 2,
  hourFrom: 9,
  hourTo: 17,
  hourAt: 9,
  dom: '*',
  month: '*',
  dowMode: 'every',
  dowAt: '1',
};

const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function buildExpression(b: BuilderState): string {
  const minute =
    b.minuteMode === 'every' ? '*' : b.minuteMode === 'step' ? `*/${b.minuteStep}` : String(b.minuteAt);
  let hour: string;
  switch (b.hourMode) {
    case 'every':
      hour = '*';
      break;
    case 'step':
      hour = `*/${b.hourStep}`;
      break;
    case 'range':
      hour = `${b.hourFrom}-${b.hourTo}`;
      break;
    default:
      hour = String(b.hourAt);
  }
  const dom = /^\d+$/.test(b.dom) ? b.dom : '*';
  const month = /^\d+$/.test(b.month) ? b.month : '*';
  const dow =
    b.dowMode === 'every' ? '*' : b.dowMode === 'weekdays' ? '1-5' : b.dowMode === 'weekend' ? '0,6' : b.dowAt;
  return `${minute} ${hour} ${dom} ${month} ${dow}`;
}

export function describeBuilder(b: BuilderState): string {
  const parts: string[] = [];
  if (b.minuteMode === 'step') parts.push(`every ${b.minuteStep} min`);
  else if (b.minuteMode === 'at') parts.push(`at :${String(b.minuteAt).padStart(2, '0')}`);
  if (b.hourMode === 'range') parts.push(`hours ${b.hourFrom}-${b.hourTo}`);
  else if (b.hourMode === 'at') parts.push(`at ${String(b.hourAt).padStart(2, '0')}:00`);
  if (b.dowMode === 'weekdays') parts.push('weekdays');
  else if (b.dowMode === 'weekend') parts.push('weekends');
  else if (b.dowMode === 'at') parts.push(DOW_NAMES[parseInt(b.dowAt, 10)] || b.dowAt);
  if (parts.length === 0) parts.push('as configured');
  return parts.join(', ');
}
