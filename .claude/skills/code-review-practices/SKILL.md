---
name: code-review-practices
description: >-
  Project-specific code-review checklist for this blog monorepo. Use before
  opening a PR or when reviewing a diff — to verify layer boundaries, type
  safety, the Sanity→types→service→ui→web data flow, SEO, accessibility, and
  test coverage. Apply when reviewing or self-reviewing changes in this repo.
---

# Code review practices

Review against the contracts in `SPEC.md` (the single durable reference). The
architecture is the deliverable, so boundary violations are blocking, not nits.

**Spec sync (blocking):** if the diff changes architecture, layer contracts,
env vars, or the content model, `SPEC.md` must be updated in the same PR.

## 0. Mechanical pass (blocking — run the commands, don't eyeball)

Checklist prose gets skimmed; commands don't miss. Run each of these over the
**full diff** (`git diff main...HEAD`, plus `git diff` if the tree is dirty)
and treat every hit as a blocking finding unless explicitly allowed:

```bash
BASE=main
D() { git diff "$BASE"...HEAD; git diff; }

# Debug artifacts — console.log/info/debug/trace never land
# (console.warn/error are allowed in apps/web server code)
D | grep -nE '^\+.*console\.(log|info|debug|trace)'
D | grep -nE '^\+.*\bdebugger\b'

# Focused/skipped tests
D | grep -nE '^\+.*\.(only|skip)\('

# New suppressions need a stated justification
D | grep -nE '^\+.*(eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck)'

# Leftovers and conflict markers
D | grep -nE '^\+.*(TODO|FIXME|XXX|HACK)'
D | grep -nE '^(<<<<<<<|>>>>>>>)'

# Secrets / env files
D | grep -nE '^\+.*(_TOKEN|_SECRET|API_KEY)\s*[:=]'
git diff "$BASE"...HEAD --name-only | grep -E '^\.env'
```

Also scan the diff by eye for commented-out code blocks — grep can't catch
those reliably. ESLint's `no-console` (in `configs/eslint/base.js`) backs this
up at lint time; the grep pass exists so review catches what config misses.

Expected false positives: a diff that edits this skill (or other docs quoting
these patterns) will hit its own example strings. Hits inside documentation
code fences are not findings — report only hits in real code.

## 1. Layer boundaries (blocking)

- `@blog/ui` imports **no** `service`, `sanity`, `next-sanity`, or `fetch`. Pure
  props in, markup out.
- `@blog/service` imports **no** React and nothing from `@blog/ui`. It is the
  only package importing the Sanity SDKs.
- `apps/web` is the only place `ui` and `service` meet: Server Components fetch
  via `service`, pass typed props to `ui`. No GROQ or raw Sanity client in `web`.
- `apps/web` never imports `next/link` directly — all links use `Link` from
  `@/i18n/navigation` (next-intl).
- Dependency graph stays acyclic: `web → ui/service/config/utils`,
  `service → config/utils`, `ui → config`, `cms → config (types via typegen)`.

## 2. Type safety (blocking)

- No `any`; `unknown` is narrowed. `strict` + `noUncheckedIndexedAccess` honoured.
- `@blog/service` uses the generated types in
  `packages/config/src/sanity/generated/types.ts` — no hand-redeclared content
  shapes. `@blog/ui` defines its own prop types; it does not import from
  `@blog/service` or depend on service view-models.
- If schemas changed, the generated types were regenerated (`pnpm typegen`) and
  committed, downstream `service` types updated, and — for existing-shape
  changes — a content migration is present or explicitly ruled out.
- Every field the CMS schema marks `.required()` has `.notNull()` in the
  corresponding `service` groqd projection. Optional fields use plain
  `sub.field()` with no fallback sentinel.
- **CMS schema/migration diffs** hold the `cms-schema-practices` bar:
  - No stored-value or `_type` literal repeated across files — constants from
    `@blog/config` (renaming a stored value must be a one-file change).
  - Repeated field patterns (e.g. mode+custom pairs) extracted into a schema
    helper, not copy-pasted.
  - Restructures keep **validation parity**: constraints that existed on the
    old shape exist on the new one (container-level `rule.custom()`/`min` for
    moved required fields, cardinality rules once arrays allow duplicates) —
    or the PR explicitly states which constraint was dropped and why.
  - Migrations: target-state idempotency guard on **every** document-type
    branch, one source of truth for moved-field lists, and a co-located test
    (transform + re-run no-op).

## 3. Rendering & data

- Server Components by default; `"use client"` only where interaction needs it.
- ISR present (`next: { revalidate, tags }`); revalidate route verifies the
  secret. No accidental fully-dynamic rendering of static content.
- Queries project only needed fields; no over-fetching.

## 4. SEO & accessibility

- Per-route `generateMetadata` (canonical, OG, Twitter); JSON-LD on posts.
- `sitemap.ts` / `robots.ts` / RSS still valid after route changes.
- Semantic HTML, image `alt`, focus-visible, color contrast via tokens.

## 5. Styling

- Token utilities from the shared preset, not raw hex. Dark mode intact.
- New `ui` class names are reachable by the web app's `@source` glob.
- No raw Tailwind class strings inline in JSX — in `@blog/ui` **and**
  `apps/web` alike. Classes live in a co-located `{component}-variants.ts`
  via `tv()` from `tailwind-variants`. No standalone `clsx` or `tailwind-merge`
  usage. Exception: `next/font` variable class names in `layout.tsx`.
- Responsive classes are mobile-first, using only `md:`/`lg:` as the primary
  tiers (no custom `--breakpoint-*`).

## 6. Tests & stories

- New/changed `ui` components have a co-located `*.test.tsx` and a Storybook
  story (follow `ui-storybook` skill). Both are required, not optional.
- New/changed `service` functions have a co-located `*.test.ts`.
- Bug fixes include a regression test that failed before the fix.
- `pnpm test` green.

## 7. Hygiene

- Conventional commit, one concern per PR. No stray `console.log`, no committed
  secrets/`.env`. `pnpm type-check`, `lint`, `test`, `build` pass from root.

## How to run a review here

**Pre-commit reviews are delegated to the `reviewer` subagent**
(`.claude/agents/reviewer.md`) — a fresh context has no author bias and no
memory of "why the code is fine". The orchestrator dispatches it after the
verify gates pass and before asking to commit; it runs the passes below and
reports a verdict with blocking/non-blocking findings. If you are reviewing
manually (e.g. someone else's PR, or the subagent is unavailable), run the
same passes yourself.

The review runs **three passes** over the diff, in order — a hit in an early
pass does not skip the later ones:

1. **Mechanical pass (section 0).** Run the commands; every hit is blocking.
2. **Contract pass (sections 1–7).** Map each changed file to its layer, walk
   the checklist; flag boundary/type issues first (blocking) then quality.
   This encodes _our_ architecture — a generic reviewer can't know it.
3. **General pass.** The dimensions a contract check won't catch:
   - **Security:** injection/XSS/SSRF, auth/authz, secrets, unsafe deserialization.
   - **Performance:** N+1 queries, O(n²) in hot paths, unbounded loops/queries,
     resource leaks.
   - **Correctness:** edge cases (empty/null/overflow), race conditions, error
     handling/propagation, off-by-one, **migration idempotency** (a re-run must
     not overwrite/lose data).
   - **Maintainability:** naming, single responsibility, duplication, test coverage.

On PRs, the `claude-code-review` CI workflow (`.github/workflows/`) also runs
the general `/code-review` automatically — but don't rely on it in place of
the pre-commit review: CI reviews after the push, this review gates the commit.
