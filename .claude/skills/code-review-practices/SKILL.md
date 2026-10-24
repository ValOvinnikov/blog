---
name: code-review-practices
description: >-
  Project-specific code-review checklist for this blog monorepo. Use before
  opening a PR or when reviewing a diff — to verify layer boundaries, type
  safety, the Sanity→types→service→ui→web data flow, SEO, accessibility, and
  test coverage. Apply when reviewing or self-reviewing changes in this repo.
---

# Code review practices

Review against the layer contracts in `CLAUDE.md` and the architecture in
`SPEC.md`. Boundary violations are blocking, not nits. Other files cite
sections 0–7 by number (`reviewer.md`, `testing-practices`,
`docs/context/claude-code.md`, `configs/eslint/README.md`) — keep the
numbering.

**Spec and feature-doc sync (blocking).** The diff carries every doc update
`CLAUDE.md` "Spec sync", "Feature docs" and "Docs sync" require, in the same
PR: `SPEC.md` for an architecture-core change, the feature's
`docs/features/<feature>.md` (created on first touch) for a behaviour change,
and for a content-model change that page plus any `SPEC.md` §6 entry still
describing the old shape.

## 0. Mechanical pass (blocking — run the commands, don't eyeball)

Run each over the **full diff** (`git diff origin/main...HEAD`, plus `git diff`
if the tree is dirty). Every hit is a blocking finding unless allowed below.

```bash
BASE=origin/main
D() { git diff "$BASE"...HEAD; git diff; }

# Bare console.* and debugger. Exempt: files outside no-console's .ts/.tsx
# scope (root scripts/** and packages/studio/scripts/**, all .mjs), tests, and
# the per-workspace preset exemptions CLAUDE.md → "No bare console.*" lists.
D | grep -nE '^\+.*console\.(log|info|debug|trace|warn|error)'
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

# A real Sanity project id pasted into a fixture via a copied Access API error.
# Read each hit — the id may be an intentional fake. Deliberately narrow: a
# general id-shaped pattern flags every mock id, hash and slug.
D | grep -nE '^\+.*/access/project/[a-z0-9]{8}/'

# Tests that restate their source (testing-practices → "What not to test").
# The grep narrows; judge by eye.
D | grep -nE '^\+.*(fields\.map\(\(f\) => f\.name\)|typeof [^)]*\)\.toBe\(.function.\)|\.name\)\.toBe\()'

# Tests that bypass Testing Library (testing-practices "Writing a component
# test" → "Never drop to a raw DOM query"). Lint fails all of these except a
# chained walk (`container.children[0]`), so a bare hit means a suppression
# was added.
D | grep -nE '^\+.*(toHaveClass|\.className|\.classList|container\.querySelector|document\.querySelector|baseElement\.querySelector|\.(parentElement|parentNode|firstChild|lastChild|children|childNodes|nextSibling|previousSibling)\b)'
D | grep -nE '^\+.*const \{[^}]*(getBy|queryBy|findBy|getAllBy|queryAllBy|findAllBy)[^}]*\} = render'

# A query inline in expect (testing-practices "Writing a component test" →
# "Name the element"). Run over every test file the diff touches, not only
# the added lines: a touched file is converted whole.
D | awk '/^\+\+\+ b\//{f=substr($0,7)} f ~ /\.test\.tsx?$/{print f}' | sort -u | xargs -r grep -nE 'expect\((await )?screen\.|expect\($' 2>/dev/null

# Faking our own components, or reading a fake's arguments (testing-practices
# → "What to fake"). A vi.mock of our own component is allowed only in a
# *-module-renderer.test.tsx or a route file's test under src/app/. A
# mock.calls hit is blocking only when it reads a faked component's props
# outside those files — reading an edge fake's arguments is fine.
D | awk '/^\+\+\+ b\//{f=$0} /^\+vi\.mock\(.(@web\/(components|modules)|@platform\/components|@blog\/ui)/ && f !~ /(module-renderer|\/src\/app\/.*)\.test/{print FNR": "$0}'
D | grep -nE '^\+.*mock\.calls'

# Added or edited test titles over 80 characters (testing-practices → Conventions).
D | grep -nE "^\+[[:space:]]*it(\.each\(.*\))?\([[:space:]]*['\"\`][^'\"\`]{81,}"

# Comments (CLAUDE.md → "Comments default to zero"): a `Name — does X` doc
# block, a doc block of three or more lines, a `//` inside a body. Read each
# hit — the one-line gotcha the rule allows is not a finding.
D | grep -nE '^\+[[:space:]]*\* [A-Z][A-Za-z0-9]+ — '
D | awk '/^\+[[:space:]]*\/\*\*/{n=0;b=1;next} b&&/^\+[[:space:]]*\*\//{b=0;if(n>=3)print FNR": doc block of "n" lines";next} b&&/^\+/{n++}'
D | grep -nE '^\+ {4,}// '

# Touched test files over 500 lines (testing-practices → "When you touch a
# test file"). Not blocking by itself: read each hit first for the §6 pruning
# findings.
( git diff "$BASE"...HEAD --name-only --diff-filter=d; git diff --name-only --diff-filter=d ) \
  | grep -E '\.test\.tsx?$' | sort -u | xargs -r wc -l | awk '$2 != "total" && $1 > 500'

# Any comment in a test file (testing-practices "What not to test" → "No
# comments in a test file").
D | awk '/^\+\+\+ b\//{t=($0 ~ /\.test\.tsx?$/)} t&&/^\+[[:space:]]*(\/\/|\/\*\*|\*[[:space:]])/{print FNR": "$0}'

# A fixed fake value not named MOCK_<THING> in a test file, testing/ or
# __mocks__/ (testing-practices → "Fixture naming").
D | awk '/^\+\+\+ b\//{t=($0 ~ /(\.test\.tsx?|\/testing\/.*\.tsx?|\/__mocks__\/.*\.tsx?)$/)} t&&/^\+(export )?const [A-Za-z_][A-Za-z0-9_]* = (\047|"|`|\[|\{|-?[0-9]|faker\.)/&&!/^\+(export )?const (MOCK_|mock)/{print FNR": "$0}'

# A fake value a test adds that the workspace's testing/ or __mocks__/ already
# holds (testing-practices → "Check `testing/` for a builder"). Read each hit: it
# is blocking when the value stands for the same fake thing.
for f in $( (git diff "$BASE"...HEAD --name-only --diff-filter=AM; git diff --name-only --diff-filter=AM) | grep -E '\.test\.tsx?$' | sort -u); do
  ws=$(printf '%s' "$f" | cut -d/ -f1-2)
  { git diff "$BASE"...HEAD -- "$f"; git diff -- "$f"; } | grep -E '^\+[^+]' \
    | grep -vE '^\+\s*(import |\} from |vi\.mock\()|ByRole\(|stubEnv|process\.env' \
    | grep -oE "'[^' ]{4,}'" | sort -u | while read -r lit; do
      hit=$(git grep -l -F -e "$lit" -- "$ws/src/testing" ":(glob)$ws/src/**/__mocks__/**" | head -1)
      [ -n "$hit" ] && echo "$f: $lit is already in $hit"
    done
done

# Clones across every workspace the diff touches (~5s); read the hits that
# involve a changed file. A clone the diff creates — helper, component, hook,
# test fake, fixture, repeated arrangement — is blocking; one whose copies were
# all on main already is filed.
WS=$( (git diff "$BASE"...HEAD --name-only; git diff --name-only) | grep -E '\.(ts|tsx)$' | cut -d/ -f1-2 | sort -u )
[ -n "$WS" ] && pnpm dlx jscpd@4 --min-tokens 60 --min-lines 8 \
  --ignore '**/node_modules/**,**/generated/**,**/.next/**' --reporters console $WS 2>/dev/null \
  | grep -A2 'Clone found'
```

Also scan by eye for commented-out code, which grep can't catch reliably. Hits
inside documentation code fences (this skill quoting its own patterns) are not
findings.

## 1. Layer boundaries (blocking)

Map each changed file to its workspace and read its imports against `CLAUDE.md`
→ "Layer contracts"; every breach is blocking. The recurring misses:

- `@blog/ui` imports no `service`, Sanity SDK or `fetch` — props in, markup out.
- `apps/web` fetches in Server Components through `@blog/service` and passes
  typed props to `@blog/ui`; no GROQ or raw Sanity client in `web`.
- Links in `apps/web` go through `SmartLink`, never `next/link` or
  `@web/i18n/navigation`'s `Link` at a call site. No lint rule enforces it
  (→ `.claude/agents/web.md`).

## 2. Type safety (blocking)

- No `any`; `unknown` is narrowed; `strict` and `noUncheckedIndexedAccess`
  (`configs/tsconfig/base.json`) honoured.
- Content shapes come from `packages/config/src/sanity/generated/types.ts`,
  never hand-redeclared. `@blog/ui` defines its own prop types and imports no
  service view-model.
- A schema change commits its `pnpm typegen` output and updates `service`. An
  existing-shape change carries a migration or rules one out explicitly; a
  `packages/db/src/schema` change carries its `db:generate` migration
  (→ `CLAUDE.md` "Check for migrations", "Check for `db` (Neon/Drizzle)
  migrations too").
- No hand-written form of a type `@blog/config` exports, outside
  `@blog/utils`, `@blog/insight`, `@blog/email` and the generated Sanity types
  (→ `CLAUDE.md` "Use `@blog/config`'s shared types" for the list). Blocking
  on added lines; elsewhere in a touched file see §7 "Drift left in a touched
  file". Helper and constant placement, and the one-line idioms that never get
  a helper: `.claude/agents/config.md`.
- Every groqd `sub.field(...)` ends in `.notNull()` (schema-required) or
  `.nullable(true)` (optional). Flag an unterminated one — it throws on null
  and 404s — and a `.notNull()` on an optional field that should fall back
  (→ `.claude/agents/service.md`).
- Studio schema and migration diffs hold the `studio-schema-practices` bar:
  stored values and `_type`s as `@blog/config` constants; repeated field
  patterns in a helper; validation parity across a restructure, or the dropped
  constraint named in the PR; every migration with a target-state idempotency
  guard on each document-type branch, one source for moved-field lists, and a
  co-located transform + re-run test.

## 3. Rendering & data

- Server Components by default; `'use client'` at the leaf that needs it.
- ISR present (`next: { revalidate, tags }`); revalidate routes verify the
  secret. No accidental fully-dynamic rendering of static content.
- Queries project only the fields used.
- No request waterfall: two independent fetches awaited in sequence, a route
  blocking on a slow fetch it could stream behind `Suspense`, or a client
  component handed a whole service result to render two fields. Which Vercel
  rules apply, and the ones overridden here (never flag a missing memo):
  `react-component-practices` → "Vercel's React rules".

## 4. SEO & accessibility

- Route, metadata, JSON-LD, `sitemap.ts`, `robots.ts` and RSS changes hold
  `seo-and-metadata`: per-route `generateMetadata` (canonical, OG, Twitter),
  JSON-LD on posts, feeds still valid.
- Semantic HTML, image `alt`, visible focus, contrast via tokens.

## 5. Styling & structure

- Token utilities from the shared preset, never raw hex; dark mode intact. New
  `@blog/ui` classes are reachable by the apps' `@source` glob
  (`apps/web/index.css`, `apps/platform/index.css`).
- No class strings inline in JSX in any React workspace — classes go through a
  module-scope `tv()`; no standalone `clsx` or `tailwind-merge`. Exception:
  `next/font` variable class names in `layout.tsx`. Where the `tv()` lives,
  and when a `*-variants.ts` is folded in or extracted →
  `react-component-practices` § Styling files.
- Every `slots` value in a `tv()` is an array of strings, even a single class.
- Mobile-first, `md:`/`lg:` as the layout tiers, no custom `--breakpoint-*`
  (→ `ui-library-practices` "Responsive design").
- Findings on what the diff writes or touches, converged on touch:
  - a `components/shared/` component with a single consuming domain →
    `react-component-practices` § Where a component lives;
  - a touched file over its budget (`CLAUDE.md` "File size budgets") that does
    not extract the part it changes → `react-component-practices` § Size and
    splitting;
  - props over the ceiling, forwarded unchanged through two or more layers or
    hand-bundled into a local object, or a view-model spread and
    re-destructured → `react-component-practices` § Props.
- `apps/platform` UI: every row of `platform-ui-practices` "Red flags — stop"
  the diff writes is a finding, as is a value off its "Type", "Colour and
  contrast" or "Spacing, radius, elevation" rules.

## 6. Tests & stories

- A new or changed `@blog/ui` component has a story (`ui-storybook`) and a
  co-located behaviour test; a styling-only change gets the story and
  `no-tests-needed`, never a test. A new or changed `service` function has a
  co-located `*.test.ts`.
- Coverage means behaviour, not a file. A test whose expected value is a
  literal copied out of the file under test is **blocking** — delete it. A
  class assertion is the same mistake, prop-driven or not
  (→ `testing-practices` "What not to test").
- **Touched test files are pruned (blocking).** Read every test file the
  diff creates or edits in full. A duplicate test, a case exercising a unit
  that has its own test file beyond one wiring test, or sibling cases
  differing only in input and expected value that are not one `it.each` is
  blocking — anywhere in the file, not only in the hunks. So is a removed
  test whose behaviour no remaining test asserts, unless it failed "What not
  to test". Check the agent's **Examined** section lists each removal and
  where its behaviour is still asserted (→ `testing-practices` "When you
  touch a test file").
- **Test setup (blocking on what the diff adds)** → `testing-practices`
  "Where tests live", "Rendering and arrangement", "What to fake"; repetition
  already on `main` that the diff adds nothing to is filed (`CLAUDE.md`
  "Duplication that already existed is filed, not fixed inline").
- **Fixtures (blocking on what the diff adds)** → `testing-practices` "Where
  tests live":
  - a builder not named `mock<Thing>`, or a fixed fake value not named
    `MOCK_<THING>` — in `testing/`, a `fixtures` file, `__mocks__/` or a test
    file's own top-level `const`; render and setup helpers are exempt, and
    fixtures the diff does not add are left to their workspace's rename;
  - a fake value or entity the diff types out that a `testing/` builder, a
    `__mocks__/` default or a `MOCK_` const already holds;
  - made-up data typed by hand in a workspace whose `package.json` has
    `@faker-js/faker`, or a test file using `faker` without `faker.seed()`;
  - `@faker-js/faker` added to a workspace without the user's yes on record
    in the dispatch or ticket.
- **Reuse item (blocking).** Every implementing agent's report carries one
  (→ `CLAUDE.md` "Reuse before you create"). A missing or empty one, or an
  entry that says "none found" for a value §0's fixture scan finds in
  `testing/` or `__mocks__/`, is a finding.
- A `screen` query inside `expect(…)` in any test file the diff creates or
  touches is **blocking** — the asserted element is a named `const` first,
  and a touched file is converted whole (→ `testing-practices` "Name the
  element, then assert on the name"). `expect($` hits need a look: a
  multi-line `expect(` wrapping a query is the same finding, one wrapping a
  mock is not.
- A bug fix has a regression test that failed before the fix.
- Suite labels: a component takes ``describe(`<${Component.name}/>`, …)``,
  anything else the bare symbol. The common miss is a bare symbol on a
  component. Flag it in files the diff creates or touches
  (→ `testing-practices` Conventions).
- `pnpm test` green.

## 7. Hygiene

- Conventional commit, one concern per PR; no committed secrets or `.env*`.
  `verify-runner` has already confirmed `type-check`/`lint`/`test` — trust it
  rather than re-running the suite. `build` is CI-only.
- **Drift left in a touched file (blocking).** Read every touched file in
  full, not only its hunks. Mechanical drift anywhere in it — a comment that
  fails the comment test, a hand-written type `@blog/config` exports, a dead
  import or export, a pattern a later convention replaced — is a finding
  (→ `CLAUDE.md` "Examine before you change"). Drift in untouched files is
  not. Check the implementing agent's **Examined** section exists and that
  what it left is reported, not dropped.
- **Literals and consts (blocking on what the diff adds).** A literal that
  retypes the value of a const in `packages/config/CONSTANTS.md`, a value the
  diff writes a second time without making it a const, and a new key/value
  const that duplicates the values of an existing one are findings — in tests
  as in source (→ `CLAUDE.md` "Reuse a const; never retype its value").
  `pnpm verify`'s touched-file lint catches a retyped const value and a
  value repeated within one file, but not a value repeated across files or a
  new const restating an existing one: search for each, and compare each new
  const against the index. A const the diff adds or changes without a
  regenerated `CONSTANTS.md` fails `gen:const-index:check`.
- **Comments (blocking).** Read every comment the diff adds or touches, not
  only the grep hits, against `CLAUDE.md` "Comments default to zero". A
  sibling carrying the same block is no defence — it is the drift, and the
  diff deletes the sibling's copy where it touches that file.
- **Manual-test issue (flagged, not blocking).** Flag a UI or behaviour diff
  whose dispatch names no manual-test issue (→ `develop-feature`
  § Manual-test issue).
- **Voice candidates (listed, not blocking).** Under a "Voice candidates"
  heading, list every key the diff adds or rewords in
  `packages/config/src/voice/site-messages.*.json` with the list it landed on
  (`VOICE_FIELDS` or `VOICE_FIXED_KEYS`), and every new `@blog/ui` prop that
  renders visible text. The orchestrator checks each against the ticket's
  classification (`CLAUDE.md` "Check for Voice candidates").

## How to run a review here

Pre-commit reviews go to the `reviewer` subagent (`.claude/agents/reviewer.md`)
— a fresh context with no author bias. A manual review (a solo session's
self-review, someone else's PR) runs the same three passes, in order; a hit in
an early pass does not skip a later one:

1. **Mechanical (§0).** Run the commands; every hit is blocking.
2. **Contract (the sync item and §1–7).** Map each changed file to its layer and walk the
   checklist, boundary and type findings first.
3. **General** — what a contract check won't catch:
   - **Security:** injection/XSS/SSRF, auth/authz, secrets, unsafe
     deserialization.
   - **Performance:** N+1 queries, O(n²) in hot paths, unbounded
     loops/queries, resource leaks.
   - **Correctness:** empty/null/overflow, race conditions, error handling and
     propagation, off-by-one, migration idempotency (a re-run never
     overwrites or loses data).
   - **Maintainability:** naming, single responsibility, test coverage, and
     duplication checked against the **repo**, not the diff — a confirmed
     duplicate is blocking (→ `reviewer.md` "Duplication is checked against
     the repo, not against the diff").

No CI workflow reviews code; this pre-commit pass is the only review gate.
