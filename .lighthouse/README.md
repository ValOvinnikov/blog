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

## Activation status (blocked on #275)

This job is wired but **inert today**: `.github/workflows/lighthouse.yml`'s
Lighthouse step only runs when the repo Variable `LIGHTHOUSE_URLS` is set (one
full URL per line — the preview/smoke URL for `/` and one post page). This
repo currently has **no PR preview deploys for web** by design (Vercel's
native Git auto-deploy is disabled — `apps/web/vercel.json`,
`git.deploymentEnabled: false`, #445/#446; see `SPEC.md` §13) — deploys only
happen via the gated `deploy-development`/`deploy-production` workflows, never
pre-merge. There is nothing to point `LIGHTHOUSE_URLS` at until
[#275](https://github.com/ValOvinnikov/blog/issues/275) resolves how a
preview/smoke URL is produced per PR. Until then the job's Lighthouse step is
skipped and the job reports green (no-op), matching this repo's convention for
"activates once configured" (see the guarded deploy steps in
`deploy-development.yml`).

Once #275 lands a preview-URL mechanism, set `LIGHTHOUSE_URLS` (Settings →
Secrets and variables → Actions → Variables) to the two URLs, e.g.:

```
https://<preview-host>/
https://<preview-host>/posts/<some-slug>
```

No other change is needed — the workflow and budgets are already in place.
