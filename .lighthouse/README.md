# Lighthouse CI budgets

`.lighthouse/budgets.json` is a [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
(`@lhci/cli`) config in `lighthouserc.json` shape — consumed via the
`configPath` input of `.github/workflows/lighthouse.yml`'s
`treosh/lighthouse-ci-action` step. It sets the pass/fail bar for each
Lighthouse category as a **budget assertion**: fail the job (`"error"`) when a
category score drops below `minScore` on a run against the configured URLs.

## What each number means

Lighthouse scores each category `0–1` (displayed as `0–100` in the report
UI). `minScore` uses the `0–1` scale.

| Assertion key               | `minScore` | Displayed score | Category                                                               |
| --------------------------- | ---------- | --------------- | ---------------------------------------------------------------------- |
| `categories:performance`    | `0.9`      | ≥ 90            | Load performance (LCP, TBT, CLS, etc.)                                 |
| `categories:accessibility`  | `0.95`     | ≥ 95            | a11y audits (alt text, contrast, ARIA, landmarks, ...)                 |
| `categories:best-practices` | `0.9`      | ≥ 90            | General web best practices (HTTPS, console errors, image aspect, ...)  |
| `categories:seo`            | `0.95`     | ≥ 95            | Crawlability/indexability (meta tags, canonical, structured data, ...) |

These match the targets already stated in `SPEC.md` §10 and
`.claude/skills/seo-and-metadata/SKILL.md` (Lighthouse ≥ 95 across
categories) with performance and best-practices intentionally set slightly
lower (≥ 90) — those two categories are more sensitive to CI-runner network
variance and third-party embeds than accessibility/SEO, which are
near-deterministic given the same markup.

## How to adjust

Edit the `minScore` value for the relevant `categories:*` key directly in
`budgets.json`. Each entry is `["error" | "warn" | "off", { "minScore": <0-1> }]`:

- `"error"` — job fails (red) when the run's score is below `minScore`.
- `"warn"` — job logs a warning but stays green (useful while stabilizing a
  new budget before it goes fully advisory-required).
- `"off"` — assertion is not checked at all.

Raising a `minScore` tightens the budget (more likely to fail on
regressions); lowering it loosens the budget. There's no separate schema
migration or regeneration step — the file is read directly by the workflow
on the next run.

## Activation status — active, targets production (#826)

This job is **active**: the repo Variable `LIGHTHOUSE_URLS` (Settings →
Secrets and variables → Actions → Variables) is set to two **production**
URLs — `https://{your-hosting}/` and one live post page.

It was first activated (#399), pointed at the `development` deployment, since
this repo has **no PR preview deploys for web** by design (Vercel's native Git
auto-deploy is disabled — `apps/web/vercel.json`,
`git.deploymentEnabled: false`, #445/#446; see `SPEC.md` §13). No per-PR
preview/smoke-URL mechanism is currently tracked:
[#275](https://github.com/ValOvinnikov/blog/issues/275), the issue this
originally waited on, closed (via #822) without delivering one — it only
added the still-guarded-and-inert `SMOKE_URL` Playwright job. That first
Lighthouse run against `development` (#826) found real budget failures and
traced them to the target itself, not the site: `development` can serve
content byte-identical to production after a dataset refresh, yet is
deliberately `noindex, nofollow` (#841) — which permanently fails the SEO
category's crawlability audit — and separately carries cold-start /
unwarmed-ISR performance noise unrelated to any PR's actual changes.

**Production is the correct stable target** — it's the only environment where
the budgets measure real, indexable behavior. The accepted trade-off: this job
checks production's current health on every PR, not the PR's own diff, until a
true per-PR preview target exists (none is currently tracked). It stays
advisory (non-required, per #399) for exactly that reason.

If `LIGHTHOUSE_URLS` is ever cleared, the Lighthouse step no-ops green (see
the guarded-step pattern in `deploy-development.yml`) rather than failing —
so accidentally unsetting the Variable doesn't red the job, just silences it.

## `ci.collect.numberOfRuns: 3` — averaging out single-run noise (#846)

Once Lighthouse pointed at production (#826), the home page's Performance
score was still red — but investigating it (#846) found **no reproducible,
home-specific code defect**. A real Chrome DevTools CPU profile (captured via
Playwright + the CDP `Tracing` domain, unthrottled) showed home and the post
page cost virtually **identical** real JS execution during load (~126ms vs
~123ms of attributed script time, spread thin across the Next.js/React
runtime chunks — no single dominant blocking function on either page).

That real-hardware parity doesn't match the ~10x gap Lighthouse's _simulated_
mobile + 4x-CPU-throttle model reported (home TBT 2,310ms vs post 210ms in one
CI run) — and the action was running with the default `numberOfRuns: 1` (no
averaging). Both `treosh/lighthouse-ci-action` and `@lhci/cli`'s own docs
recommend `numberOfRuns` ≥ 3 for exactly this reason: Total Blocking Time is
one of the noisiest Lighthouse metrics under simulated throttling, and a
single un-averaged run has no way to distinguish a real regression from a
one-off noisy sample. `numberOfRuns: 3` makes Lighthouse CI take the
**median** run per URL, which is the standard mitigation.

This doesn't claim the site is fully optimized — home's LCP (~3.7s) and TBT
under throttling are still budget-adjacent and worth watching — but it does
mean **the specific "home is 4x worse than post" finding was single-run
noise, not a code defect**, so no speculative app-code change was made chasing
it. If a _median-of-3_ run still shows home meaningfully worse than post after
this change, that would be real signal worth a fresh investigation.

## Chronic-looking failures traced to two separate causes, not one (#865)

Two unrelated PRs (#860, #864) failed identically on performance/SEO, which
looked like a single chronic regression. Pulling the actual `lighthouse-results`
artifacts (`gh run download <run-id> -n lighthouse-results`) for the specific
failing audits — not just the aggregate category score — found **two
independent, already-resolved-or-inherent issues**, plus a third, unrelated,
much more serious bug discovered along the way:

- **SEO `link-text` failure (homepage only, every run in the window
  checked)**: the Hero's default CTA rendered with visible text "Read more"
  and no accessible name, which Lighthouse's `link-text` audit fails outright
  (score 0, binary). This was already fixed in `apps/service`'s
  `toHeroModule` transformer (PR #848, merged before the failing runs) — it
  computes a descriptive `ariaLabel` (`"Read more: <post title>"`) whenever
  the CTA uses the generic fallback label. The runs that still failed were
  hitting a not-yet-revalidated cached homepage; a fresh fetch confirms the
  live CTA now carries the `aria-label`. No further code change needed.
- **Performance `largest-contentful-paint` hovering at 0.88–0.89 (just under
  the 0.9 budget), both pages**: `mainthread-work-breakdown`,
  `bootup-time`, and `total-byte-weight` all scored a clean `1` — there is no
  JS-bloat or main-thread smoking gun. This is the same simulated-throttle
  sensitivity already documented above (#846): one run in the same window
  scored 0.90/0.91 with no code change in between. Treated as inherent
  measurement noise at this budget line, not a regression to chase.
- **Unrelated, more serious finding: every `/blog/[slug]` request for a
  non-existent post returned a live production `500`, not a `404`** — this is
  what caused the _later_ Lighthouse runs (after ~2026-07-27T15:24Z) to fail
  collection outright (`ERRORED_DOCUMENT_REQUEST`, `Status code: 500`)
  instead of just scoring low. Response headers on the 500
  (`x-matched-path: /500`, `age` in the tens of thousands of seconds,
  `last-modified` pinned to the last build) showed Vercel serving one frozen
  static `/500` fallback for **every** miss under that route — confirmed with
  a random, guaranteed-never-requested slug returning the identical stale
  response. This wasn't an `apps/web` code bug (the `notFound()` guard in
  `blog-post-page.tsx` is correct, and every other detail route —
  `category/[slug]`, `tag/[slug]`, `author/[slug]` — 404s correctly); it was
  a stuck build/deploy artifact. A fresh production deploy (`v0.1.12`) was
  cut to clear it — confirm `/blog/<nonexistent-slug>` returns a clean `404`
  after that deploy finishes, and if the same route wedges into serving a
  frozen `/500` again after a future deploy, that needs its own dedicated
  Vercel-side investigation (this doc is not the place to track that).

`LIGHTHOUSE_URLS`'s post-page target was also updated from
`/blog/rebuilding-my-blog-on-a-headless-cms` (deleted) to
`/blog/rendering-portable-text-nextjs` (live) — the dead URL was the direct
cause of every Lighthouse collection failure after the post was removed.
