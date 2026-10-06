import { useEffect, useMemo, useState } from 'react';
import cronstrue from 'cronstrue';
import { computeNextRuns } from './lib/nextRuns';
import { errText, parseExpression } from './lib/parse';
import { decodeShare, DEFAULT_EXPR, writeShare } from './lib/shareUrl';
import { allTimeZones, browserTimeZone, FAVORITES } from './lib/tzList';
import BuilderPanel from './components/BuilderPanel';
import DescriptionCard from './components/DescriptionCard';
import ErrorBanner from './components/ErrorBanner';
import ExpressionInput from './components/ExpressionInput';
import NextRunsCard from './components/NextRunsCard';
import PresetBar from './components/PresetBar';
import ThemeToggle from './components/ThemeToggle';

interface AppState {
  expr: string;
  tz: string;
  count: number;
  now: string | null;
}

function initialState(): AppState {
  const shared = decodeShare(location.hash);
  return {
    expr: shared?.expr ?? DEFAULT_EXPR,
    tz: shared?.tz ?? browserTimeZone(),
    count: shared?.count ?? 10,
    now: shared?.now ?? null,
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const allZones = useMemo(() => allTimeZones(), []);
  const favorites = useMemo(() => {
    const browser = browserTimeZone();
    return browserTimeZone() !== 'UTC' && !FAVORITES.includes(browser) ? [browser, ...FAVORITES] : FAVORITES;
  }, []);

  const set = <K extends keyof AppState>(key: K, value: AppState[K]) => setState((s) => ({ ...s, [key]: value }));

  // Keep the URL hash shareable (debounced so fast typing doesn't thrash replaceState).
  useEffect(() => {
    const t = window.setTimeout(() => {
      writeShare({ expr: state.expr, tz: state.tz, count: state.count, now: state.now ?? undefined });
    }, 200);
    return () => window.clearTimeout(t);
  }, [state]);

  // React to manual hash edits / back-forward navigation.
  useEffect(() => {
    const onHash = () => {
      const shared = decodeShare(location.hash);
      if (shared) {
        setState((s) => ({
          expr: shared.expr,
          tz: shared.tz ?? s.tz,
          count: shared.count ?? s.count,
          now: shared.now ?? null,
        }));
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const parsed = useMemo(() => parseExpression(state.expr), [state.expr]);

  const description = useMemo<{ text: string | null; error: string | null }>(() => {
    if (!parsed.ok) return { text: null, error: parsed.error };
    if (parsed.reboot) return { text: cronstrue.toString(parsed.expr), error: null };
    try {
      return { text: cronstrue.toString(parsed.expr), error: null };
    } catch (e) {
      return { text: null, error: errText(e) };
    }
  }, [parsed]);

  const next = useMemo<{ data: ReturnType<typeof computeNextRuns> | null; error: string | null }>(() => {
    if (!parsed.ok) return { data: null, error: null };
    if (parsed.reboot) return { data: null, error: null };
    try {
      return { data: computeNextRuns(parsed.normalized, state.tz, state.count, state.now), error: null };
    } catch (e) {
      return { data: null, error: errText(e) };
    }
  }, [parsed, state.tz, state.count, state.now]);

  // Invalid timezone strings (bad paste) also surface as an error from computeNextRuns.
  const error = !parsed.ok ? parsed.error : description.error ?? next.error ?? null;

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>
            Cron Visualizer <span className="self-hosted">self-hosted</span>
          </h1>
          <p className="tagline">Paste a cron expression — get plain English and the next run times in any timezone. Everything computes in your browser; nothing leaves your deployment.</p>
        </div>
        <ThemeToggle />
      </header>

      <main>
        <ExpressionInput value={state.expr} onChange={(v) => set('expr', v)} invalid={!!error} />

        {error && <ErrorBanner error={error} />}

        {parsed.ok && description.text && (
          <DescriptionCard
            description={description.text}
            expr={parsed.expr}
            macro={parsed.macro}
            hasSeconds={parsed.hasSeconds}
          />
        )}

        <NextRunsCard
          data={parsed.ok && !parsed.reboot ? next.data : null}
          tz={state.tz}
          count={state.count}
          onTzChange={(tz) => set('tz', tz)}
          onCountChange={(n) => set('count', n)}
          now={state.now}
          onNowChange={(now) => set('now', now)}
          allZones={allZones}
          favorites={favorites}
          reboot={parsed.ok && parsed.reboot}
        />

        <PresetBar onPick={(expr) => set('expr', expr)} />
        <BuilderPanel onApply={(expr) => set('expr', expr)} />
      </main>

      <footer>
        <p>
          100% client-side: cronstrue + cron-parser run in your browser. After the page loads, zero network requests are
          made — schedules, timezones and expressions never leave your machine.
        </p>
      </footer>
    </div>
  );
}
