import { useState } from 'react';
import { buildExpression, BuilderState, DEFAULT_BUILDER, describeBuilder } from '../lib/presets';

interface Props {
  onApply: (expr: string) => void;
}

export default function BuilderPanel({ onApply }: Props) {
  const [b, setB] = useState<BuilderState>(DEFAULT_BUILDER);
  const [open, setOpen] = useState(false);
  const expr = buildExpression(b);

  const set = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => setB((s) => ({ ...s, [key]: value }));
  const num = (v: string, lo: number, hi: number) => Math.min(hi, Math.max(lo, parseInt(v, 10) || lo));

  return (
    <section className="card builder">
      <button className="row-title as-button" data-testid="builder-toggle" onClick={() => setOpen(!open)}>
        Custom builder {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="builder-grid" data-testid="builder">
          <label>
            Minute
            <select value={b.minuteMode} onChange={(e) => set('minuteMode', e.target.value as BuilderState['minuteMode'])}>
              <option value="every">every minute</option>
              <option value="step">every N minutes</option>
              <option value="at">at minute</option>
            </select>
            {b.minuteMode === 'step' && (
              <select value={b.minuteStep} onChange={(e) => set('minuteStep', num(e.target.value, 2, 59))}>
                {[2, 5, 10, 15, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}
            {b.minuteMode === 'at' && (
              <input type="number" min={0} max={59} value={b.minuteAt} onChange={(e) => set('minuteAt', num(e.target.value, 0, 59))} />
            )}
          </label>

          <label>
            Hour
            <select value={b.hourMode} onChange={(e) => set('hourMode', e.target.value as BuilderState['hourMode'])}>
              <option value="every">every hour</option>
              <option value="step">every N hours</option>
              <option value="range">range</option>
              <option value="at">at hour</option>
            </select>
            {b.hourMode === 'step' && (
              <select value={b.hourStep} onChange={(e) => set('hourStep', num(e.target.value, 2, 23))}>
                {[2, 3, 4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}
            {b.hourMode === 'range' && (
              <span className="pair">
                <input type="number" min={0} max={23} value={b.hourFrom} onChange={(e) => set('hourFrom', num(e.target.value, 0, 23))} />
                <span>–</span>
                <input type="number" min={0} max={23} value={b.hourTo} onChange={(e) => set('hourTo', num(e.target.value, 0, 23))} />
              </span>
            )}
            {b.hourMode === 'at' && (
              <input type="number" min={0} max={23} value={b.hourAt} onChange={(e) => set('hourAt', num(e.target.value, 0, 23))} />
            )}
          </label>

          <label>
            Day of month
            <input type="text" value={b.dom} onChange={(e) => set('dom', e.target.value)} placeholder="* or 1-31" />
          </label>

          <label>
            Month
            <input type="text" value={b.month} onChange={(e) => set('month', e.target.value)} placeholder="* or 1-12" />
          </label>

          <label>
            Day of week
            <select value={b.dowMode} onChange={(e) => set('dowMode', e.target.value as BuilderState['dowMode'])}>
              <option value="every">every day</option>
              <option value="weekdays">weekdays (1-5)</option>
              <option value="weekend">weekend (0,6)</option>
              <option value="at">specific</option>
            </select>
            {b.dowMode === 'at' && (
              <select value={b.dowAt} onChange={(e) => set('dowAt', e.target.value)}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((n, i) => (
                  <option key={n} value={String(i)}>
                    {n}
                  </option>
                ))}
              </select>
            )}
          </label>

          <div className="builder-result">
            <code data-testid="builder-expr">{expr}</code>
            <button className="primary" data-testid="apply-builder" onClick={() => onApply(expr)} title={describeBuilder(b)}>
              Use expression
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
