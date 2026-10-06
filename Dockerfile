# Multi-stage, digest-pinned (digests verified 2026-10-06 via Docker Hub API; re-pin on updates).
# Stage 1 builds the static bundle with Vite. Stage 2 is pure Caddy: the app is fully static and
# computed client-side, so no Node runtime is needed — the official caddy image serves directly.

FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM caddy:2-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv

# Image ENTRYPOINT ["caddy"] + CMD ["run","--config","/etc/caddy/Caddyfile","--adapter","caddyfile"]:
# the Caddyfile's {$PORT:8080} placeholder is resolved from the environment at startup —
# Railway injects PORT at runtime; no PORT variable is ever defined in the template.
EXPOSE 8080
