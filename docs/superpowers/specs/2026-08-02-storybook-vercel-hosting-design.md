# Design: hosted `@blog/ui` Storybook on Vercel

**Issue:** #339 — `chore(dx): deploy Storybook to Vercel (hosted design system)`
**Status:** approved, not yet implemented

## Problem

`@blog/ui`'s Storybook only runs locally (`pnpm --filter @blog/ui storybook`).
Reviewing a component change visually requires checking out the branch and
starting Storybook by hand — there's no way to see it from a PR. #1037 added a
CI job that builds Storybook (catching broken stories), but a build check
alone gives no visual artifact to look at.

## Decision

Three forks, resolved with the user during brainstorming:

1. **Deploy mechanism: Vercel Git integration with PR previews**, not the
   CI-gated Vercel-CLI pattern used for `blog-dev`/`blog-prod` and (as of
   #891) `cms-dev`/`cms-prod`. This is a deliberate, stated exception:
   Storybook carries no Sanity content, tokens, or user data, so the
   access-control rationale behind "no PR previews, CI-gated only" for the
   app and Studio doesn't apply here — and the entire value of hosting
   Storybook is letting a reviewer see the change _before_ merge. A
   post-merge-only deploy would lose most of that value.
2. **Scope: `@blog/ui` only**, not `apps/web`'s Storybook too. Matches the
   issue's primary goal (design-system review) and keeps one Vercel project
   with one Root Directory — `apps/web`'s Storybook stays covered by
   #1037's CI build check (rot protection) without being hosted.
3. **Access: public, no protection.** It's a component catalog with no
   sensitive data — same posture as most public design-system sites.
   Simplest setup, no Vercel plan/config requirement.

Plus one requirement stated directly (not a fork, just a hard constraint):
**a PR that doesn't touch `@blog/ui` or its dependency graph must not trigger
a preview build.** Solved with `turbo-ignore` (see below) — the same tool
this repo's `deploy-development.yml` already uses for its `changes` gate,
just invoked as Vercel's Ignored Build Step instead of a GitHub Actions step.

**Custom domain:** `ui-library.valstack.dev`, applied to the **production**
deployment (from `main`) only. PR previews keep Vercel's own
auto-generated preview URLs — no domain needed there.

## What ships in code

- **`packages/ui/vercel.json`** (new) — declares build config explicitly in
  code, same philosophy as `apps/web/vercel.json` / `apps/cms/vercel.json`
  (avoid dashboard-setting drift):
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": "pnpm storybook:build",
    "outputDirectory": "storybook-static",
    "ignoreCommand": "npx turbo-ignore@2.10.4 @blog/ui"
  }
  ```
  No `git.deploymentEnabled: false` — this project deliberately keeps Git
  integration ON, unlike every other `vercel.json` in this repo. The
  `turbo-ignore` version pin matches `TURBO_IGNORE_VERSION` in
  `deploy-development.yml`/`deploy-production.yml`; keep them in lockstep the
  same way those two already document doing for the `turbo` devDependency.
- **`docs/DEPLOY.md`** — new short section (not folded into the dev/prod
  environment matrix — this isn't a parallel environment, it's a DX tool)
  covering the one-time Vercel project setup: create `blog-storybook`, import
  the repo, Root Directory `packages/ui`, confirm Git integration + PR
  previews are **ON** (the opposite of `blog-dev`/`blog-prod`/`cms-dev`/
  `cms-prod`'s default), add the `ui-library.valstack.dev` domain + DNS
  record. No env vars needed (no Sanity access — `@blog/ui` is pure).
- **`SPEC.md`** — a short callout near §13 noting this Vercel project exists
  and deliberately diverges from the topology described there, pointing to
  `docs/DEPLOY.md` for detail. Not a table row in the environment matrix
  (it's not a dev/prod pair).

## What stays unchanged

- **`.github/workflows/storybook-build.yml`** (#1037) — no changes. It
  remains the fast, Vercel-independent CI signal for both `packages/ui` and
  `apps/web`; the new Vercel preview is additive (visual review), not a
  replacement for that gate.
- **`packages/ui/package.json`'s `storybook:build` script** — already
  exists, already correct (`storybook build`, default `storybook-static/`
  output, confirmed working in #1037).

## Human-gated (not part of any PR)

Same posture as #891's Vercel/DNS/CORS steps — console work, documented but
not executed by an agent:

1. Create Vercel project `blog-storybook`, import `ValOvinnikov/blog`, Root
   Directory `packages/ui`, tick "Include files outside of the root
   directory", Framework Preset **Other** (or **Storybook** if Vercel offers
   it directly — either way `packages/ui/vercel.json`'s `buildCommand`/
   `outputDirectory` govern the actual build).
2. Confirm Git integration is **enabled** with PR previews **on** (this is
   the default for a newly imported project — the point is to _not_ disable
   it, unlike every other project in this repo).
3. Settings → Domains → add `ui-library.valstack.dev`; add the DNS record it
   shows at whatever registrar/DNS host manages `valstack.dev` (same
   apex-sharing rationale already established for `studio.valstack.dev` /
   `studio-dev.valstack.dev` in #891 — no session/auth concern since this
   site has no auth at all).
4. No env vars, no CORS, no tokens — `@blog/ui` never imports `service` or
   touches Sanity.

## Testing / verification

- `packages/ui/vercel.json` is a static config file — no unit test surface.
  Verification is: confirm `pnpm storybook:build` still succeeds locally
  (already proven in #1037's implementation), and confirm the `ignoreCommand`
  behaves correctly by running
  `npx turbo-ignore@2.10.4 @blog/ui --fallback=HEAD^1` locally against a
  commit that doesn't touch `packages/ui` (expect exit 0) and one that does
  (expect exit 1) — mirrors how `deploy-development.yml`'s `changes` job
  already exercises the same tool.
- The actual PR-preview behavior (build triggers correctly, skips correctly,
  deploys to a working preview URL) can only be confirmed once the human-gated
  Vercel project setup is done and a real PR touching `packages/ui` is opened
  — not verifiable in this repo's local/CI loop alone.

## Out of scope (explicitly, from the brainstorm)

- Hosting `apps/web`'s Storybook.
- Access protection (Vercel password/SSO).
- Composing both Storybooks into one instance (`refs`) — noted as an optional
  follow-up in the original issue, not pursued here.
