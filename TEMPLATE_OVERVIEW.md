Crontab.guru you can own — self-hosted. Paste a cron expression and get a human-readable
description plus the next run times computed in any IANA timezone you pick, with
daylight-saving handled correctly (the fall-back hour fires twice, spring-forward gaps
shift, exactly like a real cron). Everything is computed in your browser by cronstrue and
cron-parser: after the page loads, zero network requests are made — the served
Content-Security-Policy (`connect-src 'self'`) enforces it.

**What you get**

- Live plain-English description of any 5-field cron expression (6-field with a leading seconds field works too)
- Next 10 / 25 / 50 run times in a selectable IANA timezone — the crontab.guru-defeating feature; tz data comes from your browser's Intl database, nothing is bundled or fetched
- DST-correct math: ambiguous fall-back wall times appear twice with distinct offsets (flagged with an in-window DST note); non-existent spring-forward times shift forward
- Macros: `@yearly @annually @monthly @weekly @daily @midnight @hourly` normalized for next-run math; `@reboot` described honestly as "runs at startup — no schedule"
- One-click presets (every minute / hour / day, weekdays 9 AM, monthly) and a custom builder with per-field toggles
- Clear errors for invalid expressions (`99 * * * *`, wrong field count, unknown macros)
- Shareable `#/expr=…` URLs (fragment never sent to the server), optionally with a frozen `now=` for deterministic results
- Copy buttons for the expression and the run list; dark/light/auto theme; offline after first load

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.app/new?github_url=https://github.com/lNamelessl/self-hosted-cron-visualizer)

The template provisions two services. **visualizer** is the app itself: a static React
(Vite) bundle served by Caddy from a digest-pinned Alpine image — stateless, zero
variables (Railway injects `PORT` at runtime), healthchecked at `GET /health`. Optional
**cron-toolkit** bundles [crontab-ui](https://github.com/alseambusher/crontab-ui) (v0.4.2)
so you can also *manage* crontab jobs from a browser; it ships WITHOUT basic auth — see
the security note below.

# Deploy and Host

## About Hosting

Hosting runs two independent services. **visualizer** is a single stateless web service:
a React (Vite) single-page app served by Caddy inside a compact Alpine container. The
image is self-sufficient — it listens on the Railway-injected `PORT`, exposes `GET /health`
(200) for the Railway healthcheck, and restarts on failure (ON_FAILURE, max 10 retries).
No database, no volumes, no variables, no background workers; all schedule math happens in
the visitor's browser. **cron-toolkit** (optional) runs the official
`alseambusher/crontab-ui:0.4.2` Docker image with a persistent volume mounted at
`/crontab-ui/crontabs` for its job database, backups and logs; supervisord inside the
container runs the app plus a bundled `crond`. Its scope is jobs *inside that container
only* — for platform-native scheduling on Railway, use Railway Cron; crontab-ui is a
convenience manager, not a Railway Cron replacement.

**Security note (cron-toolkit):** it ships **without basic authentication** — anyone with
the URL can read and edit its job list. For any publicly reachable deployment, set
`BASIC_AUTH_USER` and `BASIC_AUTH_PWD` (the image's exact variable names) on the
cron-toolkit service right after deploying; basic auth activates automatically when both
are present. The visualizer has no secrets and no server-side state, so it needs no auth
variable.

## Why Deploy

crontab.guru is closed source, shows every paste to a third party, and always computes in
UTC — you debug "0 9 * * 1-5" against Austin or Berlin by doing clock arithmetic in your
head. The template marketplace is full of cron *schedulers* but has no visualizer. This
template gives your team a private crontab.guru equivalent in one click: expressions are
typed into your own deployment, never sent to the server or anywhere else, and next-run
times are computed in the timezone your servers actually run in — including exactly how
DST transitions behave. Zero required variables, negligible resource usage: the visualizer
is a static site; the optional toolkit is one container with a volume.

## Common Use Cases

- Writing or reviewing a cron expression and confirming it means what you think it means, in plain English
- Checking when a job will actually fire in the server's timezone — across a DST boundary (the fall-back hour appears twice with different offsets)
- Sharing an expression plus its upcoming run times with a teammate via a `#/expr=` link (optionally frozen at a fixed `now=` for reproducible discussions)
- Auditing a legacy crontab: paste each line, read the description, spot ranges like `9-17` or steps like `*/15`
- Teaching cron syntax to developers who don't speak five-field fluently — presets and the field-toggle builder make the mapping visible

## Dependencies for

### Deployment Dependencies

None beyond the images themselves. The visualizer is one container with everything baked
in — Caddy (official digest-pinned image) serves the static app and the health endpoint;
there is no database, no external API, and nothing to provision. The cron-toolkit service
pulls the official `alseambusher/crontab-ui` image from Docker Hub at deploy time and
persists its job database on a Railway volume; it needs no external service either. Both
services read the Railway-injected `PORT` at runtime — no variables are required at
deploy, and none are defined by the template.
