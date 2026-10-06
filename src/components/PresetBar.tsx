import { MACRO_CHIPS, PRESETS } from '../lib/presets';

interface Props {
  onPick: (expr: string) => void;
}

export default function PresetBar({ onPick }: Props) {
  return (
    <section className="card presets">
      <div className="row-title">Presets</div>
      <div className="chips">
        {PRESETS.map((p) => (
          <button key={p.expr} className="chip" data-testid={`preset-${p.expr.replace(/\s+/g, '_')}`} onClick={() => onPick(p.expr)} title={p.expr}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="row-title">Macros</div>
      <div className="chips">
        {MACRO_CHIPS.map((m) => (
          <button key={m} className="chip macro" data-testid={`preset-${m}`} onClick={() => onPick(m)}>
            <span className="mono">{m}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
