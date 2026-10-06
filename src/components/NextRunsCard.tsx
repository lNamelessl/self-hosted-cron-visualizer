import { formatRunLine, NextRuns as NextRunsData } from '../lib/nextRuns';
import CopyButton from './CopyButton';

interface Props {
  data: NextRunsData | null;
  tz: string;
  count: number;
  onTzChange: (tz: string) => void;
  onCountChange: (n: number) => void;
  now: string | null;
  onNowChange: (now: string | null) => void;
  allZones: string[];
  favorites: string[];
  reboot: boolean;
}

export default function NextRunsCard({
  data,
  tz,
  count,
  onTzChange,
  onCountChange,
  now,
  onNowChange,
  allZones,
  favorites,
  reboot,
}: Props) {
  const listText = data ? data.runs.map((r) => formatRunLine(r, tz)).join('\n') : '';

  return (
    <section className="card" data-testid="next-runs-card">
      <div className="row-title">Next runs</div>

      <div className="controls">
        <label className="inline">
          Timezone
          <input
            data-testid="tz-select"
            className="tz-input"
            list="tz-options"
            value={tz}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onTzChange(e.target.value)}
          />
          <datalist id="tz-options">
            {favorites.map((z) => (
              <option key={z} value={z} />
            ))}
            {allZones.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </label>

        <label className="inline">
          Show
          <select data-testid="count-select" value={count} onChange={(e) => onCountChange(parseInt(e.target.value, 10))}>
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                next {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {reboot ? (
        <p className="note" data-testid="reboot-note">
          <span className="mono">@reboot</span> runs once when the machine or container starts — it has no schedule, so
          upcoming run times cannot be computed.
        </p>
      ) : (
        <>
          {now && (
            <p className="note" data-testid="now-note">
              Computed from frozen <span className="mono">now = {now}</span> ({tz}){' '}
              <button className="link" onClick={() => onNowChange(null)}>
                use real time
              </button>
            </p>
          )}
          {data && data.dstTransition && (
            <p className="note dst" data-testid="dst-note">
              Daylight-saving transition inside this window — the repeated wall-clock hour appears twice with different
              offsets, exactly like a real cron fires.
            </p>
          )}
          <ol className="runs" data-testid="next-runs">
            {data?.runs.map((r, i) => (
              <li key={i} data-testid="next-run-item">
                <span className="wall">{r.wall}</span>
                <span className="off">{r.offset}</span>
              </li>
            ))}
          </ol>
          {data && (
            <div className="card-actions">
              <CopyButton text={listText} label="Copy list" testId="copy-runs" />
            </div>
          )}
        </>
      )}
    </section>
  );
}
