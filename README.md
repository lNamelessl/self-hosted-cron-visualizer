# Self-Hosted Cron Expression Visualizer

A crontab.guru you can own. Paste a cron expression → get a plain-English description and
the next N run times, computed **in any IANA timezone you pick** with correct
daylight-saving behavior. 100% client-side: after the page loads, zero network requests —
enforced by the served Content-Security-Policy (`connect-src 'self'`) and a build gate
that scans the bundle for external references.

- **cronstrue** (3.29.0) — expression → human-readable text
- **cron-parser** (5.10.1) — next-run iteration; timezone support via luxon/Intl (IANA
  data comes from the browser runtime, nothing bundled or fetched)
- **Caddy** — static serving, `$PORT` binding, `/health`, security headers

## Features

| | |
|---|---|
| Description | live cronstrue text for any 5-field expression (6-field with seconds also accepted, badged) |
| Next runs | 10 / 25 / 50 upcoming runs in a selectable IANA timezone (list from `Intl.supportedValuesOf`) |
| DST-correct | fall-back hour appears twice with distinct offsets (with an in-window DST note); spring-forward gaps shift forward — same as a real cron fires |
| Macros | `@yearly @annually @monthly @weekly @daily @midnight @hourly` normalized for next-run math; `@reboot` shown as "runs at startup — no schedule" |
| Presets & builder | one-click presets + custom builder with per-field toggles |
| Errors | clear messages for `99 * * * *`, wrong field count, unknown macros (cron-parser/cronstrue failures surfaced verbatim) |
| Sharing | `#/expr=…&tz=…&count=…&now=…` URL fragment (never sent to the server); `now=` freezes "now" for deterministic results |
| Convenience | copy buttons (expression + run list), dark/light/auto theme |
| Health | `GET /health` → 200 `ok` (Railway healthcheck) |

## Deploy (Railway template: two services)

**visualizer** — the app. Stateles static site in a digest-pinned
`node:22-alpine` → `caddy:2-alpine` image. Zero variables; Railway injects `PORT`
(the Caddyfile reads `{$PORT:8080}` at startup). Healthcheck: `/health`.

**cron-toolkit** (optional) — [crontab-ui](https://github.com/alseambusher/crontab-ui)
v0.4.2 for browser-based crontab management, with a Railway volume at
`/crontab-ui/crontabs` persisting its job database, backups and logs.

> **cron-toolkit ships WITHOUT authentication.** Anyone with the URL can read and edit
> its job list. For any publicly reachable deployment, set these two variables on the
> cron-toolkit service immediately after deploy (exact image variable names):
>
> - `BASIC_AUTH_USER` — the username
> - `BASIC_AUTH_PWD` — the password
>
> Basic auth activates automatically when both are set. The visualizer itself needs no
> auth: it has no secrets and no server-side state.

Scope note: crontab-ui manages jobs **inside its own container** (supervisord runs a
bundled `crond` there). It is a convenience manager — for platform-native scheduling on
Railway, use Railway Cron.

## Local development

```bash
npm install
npm run dev        # vite dev server
npm run build      # tsc + vite build + external-reference gate
npm run preview    # serve dist/
```

The build fails if any fetchable external URL (fonts, scripts, analytics, CDNs) appears
in `dist/` — see `scripts/check-external-refs.mjs` for the documented allowlist (license
/ namespace identifiers only).

## How timezone math works

`cron-parser` v5 delegates timezone handling to luxon, which uses the **runtime's Intl
IANA database** — the browser (or Node ≥ 18) already ships a full timezone database, so
the bundle stays small and correct (tzdb updates arrive with browser updates, not deploys).
No network fetch occurs at any point; the app works fully offline after first load.

### Acceptance fixtures (verified against croniter + hand-checked IANA rules)

Expression `*/15 9-17 * * 1-5`, frozen `now = 2026-10-30T12:00:00` in `America/New_York`
→ next 10 runs: Fri Oct 30 12:15 PM → 02:30 PM (UTC-4), weekends skipped.

Fall-back fold, `*/15 * * * *`, `now = 2026-11-01T00:30:00` in `America/New_York` →
12:45 AM (UTC-4), **1:00–1:45 AM twice** (UTC-4 then UTC-5), 2:00 AM (UTC-5) — the
repeated hour fires twice, exactly like Vixie cron.

Spring-forward, `0 2 * * *`, `now = 2026-03-07T12:00:00` in `America/New_York` →
Mar 8 **3:00 AM** (2:00 AM does not exist that day), then 2:00 AM on following days.

## Repo layout

```
src/lib/parse.ts       normalization + field-count guard + macro table (cronstrue throws
                       plain strings — errText() handles both)
src/lib/nextRuns.ts    cron-parser iteration + Intl wall-clock/offset formatting
src/lib/shareUrl.ts    #/expr=… encode/decode
src/lib/presets.ts     presets + builder composition
src/lib/tzList.ts      Intl.supportedValuesOf('timeZone') + favorites
Caddyfile              :{$PORT:8080}, encode, CSP, /health, try_files → index.html
Dockerfile             node:22-alpine build stage → pure caddy:2-alpine runtime
scripts/check-external-refs.mjs   offline-claim build gate
railway.json           DOCKERFILE builder, healthcheck /health, ON_FAILURE × 10
```

MIT-style use at your own risk; cronstrue/cron-parser are MIT-licensed.
