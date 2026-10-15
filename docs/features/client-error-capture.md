---
title: Client error capture
status: built
layers: [web]
code:
  - apps/web/src/utils/report-client-error/**
  - apps/web/src/app/api/client-log/**
  - apps/web/src/server/client-log/**
  - apps/web/src/server/rate-limit/**
epics: []
---

# Client error capture

## What it does

When something fails in a reader's browser, such as an error boundary rendering or a bookmark status lookup failing, the public site sends a small report to its own endpoint, which writes it to the server log beside every other `web` log line. There is no third-party browser SDK: the site keeps its Lighthouse budget and no reader data leaves for a vendor. Readers see nothing of this.

## Surfaces and routes

- `POST /api/client-log` — unauthenticated, outside the proxy (its matcher excludes `/api/**`), so no tenant or language resolution runs in front of it. Answers 204, or 400 / 413 / 429.
- Callers of `reportClientError`: `LocaleErrorPage` and `GlobalErrorPage` on mount, `BookmarkButton`'s catch, and `useCopyToClipboard`'s catch.

## Data

- Payload (fixed fields): `event`, `message`, optional `stack`, `url` (pathname only), `digest`, `userAgent`.
- Logged once per report as `client_log.report_received` at `error`, with the client's event under `clientEvent` and `source: 'client'`.
- Nothing is stored in Neon or Sanity; logs land in Vercel Runtime Logs for the `web` project.

## Configuration

- None. No editor, owner or operator setting; not plan-gated.

## Constraints and invariants

- **Browser side** — reports are deduplicated by `event` + message and capped at five per page load (a circuit breaker for render loops). Sent with `navigator.sendBeacon`, falling back to `fetch(..., { keepalive: true })`; a failed send is swallowed. Stacks are cut to 20 lines and 1000 characters with every query string stripped; message 500, user agent 300 characters.
- `reportClientError` is called alongside the shared logger at a catch site, never instead of it; server code never calls it.
- **Server side** — a `.strict()` Zod schema rejects any extra key; `event` must match the static dot-namespaced pattern and is at most 80 characters.
- The 8 KB payload cap is enforced while reading the request stream, not only from `Content-Length`.
- Every field except `event` passes through `sanitizeLogMessage` (`event` is bounded by the event-name regex instead) and `url` loses its query and fragment before logging, whatever the browser already did.
- The rate limit is 20 requests per minute per client IP and request host, counted in Upstash Redis through the shared `createRateLimiter` factory, so it holds across instances. Without Redis outside production (local dev, tests, previews) it falls back to one instance's memory, capped at 5000 tracked clients.
- The client caps and the schema caps are separate literals that must be kept equal by hand (a client module cannot import the server-only schema).
- `window.onerror` and `unhandledrejection` are not captured.

## Dependencies

- Layers: `web` only; `@blog/insight` for `sanitizeLogMessage` and the logger core.
- Features: [errors-and-404](./errors-and-404.md), [bookmarks](./bookmarks.md).
- Env vars: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (shared rate-limit store).

## Entry points

- `apps/web/src/utils/report-client-error/report-client-error.ts`
- `apps/web/src/app/api/client-log/route.ts`
- `apps/web/src/server/client-log/client-log-schema/client-log-schema.ts`
- `apps/web/src/server/rate-limit/rate-limiter/rate-limiter.ts`
- `apps/web/src/utils/logger/logger.ts`

## Tests and stories

- `report-client-error.test.ts`, `app/api/client-log/route.test.ts`, `client-log-schema.test.ts`, `rate-limiter.test.ts`, `in-memory-rate-limit-store.test.ts`.
- No stories.

## Related

- #1645 — server error and warn lines shipped to Grafana Cloud Loki, including these reports.
