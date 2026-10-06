import { MACRO_LIST } from '../lib/parse';

interface Props {
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}

export default function ExpressionInput({ value, onChange, invalid }: Props) {
  return (
    <section className="card">
      <label className="field-label" htmlFor="expr">
        Cron expression
      </label>
      <input
        id="expr"
        data-testid="expr-input"
        className={invalid ? 'expr invalid' : 'expr'}
        type="text"
        spellCheck={false}
        autoComplete="off"
        autoFocus
        placeholder="*/15 9-17 * * 1-5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="hint">
        <span className="mono">minute hour day-of-month month day-of-week</span> — or a macro: {MACRO_LIST.join(' ')}
      </div>
    </section>
  );
}
