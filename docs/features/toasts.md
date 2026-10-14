---
title: Toasts
status: built
layers: [ui, web, platform, config]
code:
  - packages/config/src/constants/toast.ts
  - packages/ui/src/components/molecules/toast/**
  - packages/ui/src/components/organisms/toast-viewport/**
  - apps/web/src/context/toast-provider/**
  - apps/platform/src/context/toast-provider/**
  - apps/platform/src/components/shared/toast/**
  - apps/platform/src/components/shared/toast-viewport/**
epics: []
---

# Toasts

## What it does

Short, non-blocking notices that confirm or report the outcome of an action: a saved bookmark (with Undo), a newsletter subscription, an account change on the public site; a saved Look, Voice, Email, Languages or Features form, or a provisioning update, in the platform. Each app has its own provider and the same queueing rules; the public site renders through `@blog/ui`, the platform through its own components.

## Surfaces and routes

- Public site: `ToastProvider` wraps every page via `SiteProviders`; the viewport is a labelled `region` pinned to the bottom edge. Callers: bookmark button, newsletter subscription control, display-name, provider-link and delete-account controls.
- Platform: `ToastProvider` in `apps/platform/src/app/[locale]/layout.tsx`. Callers: Look, Voice, Email, Languages and Features settings, the tenant details panel and the provisioning poll.
- No Studio surface.

## Data

- `TOAST_TYPE`: `SUCCESS`, `INFO`, `WARNING`, `ERROR`, plus a loading state for `toast.promise`.
- Payload: `message` (required), optional `title`, `time`, `action` (`label`, `keyHint`, `onAct`), `durationMs`, `coalesceKey`.
- State lives in an in-memory store per provider (`createToastStore`), read with `useSyncExternalStore`; nothing is persisted and the server snapshot is always empty.

## Configuration

- None. Toast copy is supplied by each caller from its app's catalogue; the public site's viewport label, dismiss label and merge suffix are fixed catalogue keys (`toastProvider.*`), not Voice.
- Colours follow the tenant's Look on the public site through the surface tokens (see [design-tokens-and-surfaces](./design-tokens-and-surfaces.md)).

## Constraints and invariants

- API: `useToast()` returns `success`, `info`, `warning`, `error`, `promise` and `dismiss`; it throws outside a provider.
- At most four toasts are visible. A fifth evicts the oldest non-error toast; when all four are errors it waits in a pending queue and is promoted as one leaves.
- Default life: success and info 3.6 s, warning 5 s, error sticky until dismissed. `durationMs` overrides.
- Identical string success/info toasts within 1 s merge into one with a ×N counter; a matching `coalesceKey` replaces the existing toast's content and restarts its timer.
- `toast.promise` shows a loading toast only if the promise is still pending after 400 ms, then settles it in place into success or error.
- Hover or focus pauses a toast's timer; leaving resumes it with the remaining time. Escape dismisses the focused toast, otherwise the newest, in both apps. Acting on a toast's action dismisses it.
- Errors announce as `role="alert"` (assertive); other types as `role="status"` (polite).
- The two apps share no toast code: `apps/web` and `apps/platform` each own a store and provider, and only the public site uses the `@blog/ui` `Toast` and `ToastViewport`.

## Dependencies

- Layers: `config` (`TOAST_TYPE`), `ui` (public-site presentation), `web`, `platform`.
- Features: [bookmarks](./bookmarks.md), [newsletter](./newsletter.md), [reader-account](./reader-account.md), [look](./look.md), [voice](./voice.md), [email](./email.md), [languages](./languages.md), [plans-and-entitlements](./plans-and-entitlements.md), [tenant-provisioning](./tenant-provisioning.md).
- Env vars: none.

## Entry points

- `apps/web/src/context/toast-provider/toast-provider.tsx`, `toast-store.ts`, `use-toast-row-pause.ts`
- `apps/platform/src/context/toast-provider/toast-provider.tsx`, `toast-store.ts`, `toast-timers.ts`, `components/toast-row/toast-row.tsx`
- `packages/ui/src/components/molecules/toast/toast.tsx`, `packages/ui/src/components/organisms/toast-viewport/toast-viewport.tsx`
- `apps/platform/src/components/shared/toast/toast.tsx`, `apps/platform/src/components/shared/toast-viewport/toast-viewport.tsx`

## Tests and stories

- Web: `toast-store.test.ts`, `toast-provider.test.tsx`.
- Platform: `toast-store.test.ts`, `toast-provider.test.tsx`, `toast.test.tsx`, `toast-viewport.test.tsx`.
- UI: `toast.test.tsx`, `toast-viewport.test.tsx`; stories `toast.stories.tsx`, `toast-viewport.stories.tsx`.
- Visual reference: `docs/design-reference/toast-notification-mock.html`.

## Related

- None open.
