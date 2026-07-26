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
URLs — `https://valstack.dev/` and one live post page.

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
