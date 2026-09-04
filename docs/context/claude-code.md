# Working with Claude Code

> Part of the docs split described in [`docs/README.md`](../README.md).
> `CLAUDE.md` (repo root) is the operational source of truth this
> configuration implements — this file documents _what ships and why_, not
> the process rules themselves.

This repo ships Claude Code configuration so contributors stay inside the layer
contracts:

- **Scoped subagents** (`.claude/agents/`) — one per layer, primed with that
  layer's rules:
  - `config` — `packages/config`, `packages/utils`, `configs/*`: UPPERCASE
    constants, the `routes` URL builder, shared config packages, cross-workspace
    alias wiring, guards `src/sanity/generated/` (typegen-only).
  - `studio` — Sanity schemas, content modelling, typegen, and the `StudioMount` component `apps/platform` renders.
  - `service` — Sanity client, GROQ, typed fetchers (no React).
  - `db` — `packages/db` (`@blog/db`): Neon Postgres + Drizzle, the
    relational sibling to `service` for the engagement layer (Auth.js,
    comments, ratings, bookmarks, subscribers); never Sanity, never React,
    consumed by the two apps (`web`, `admin`) and by `@blog/auth`; owns the
    `drizzle-kit generate`/`migrate`
    schema-migration workflow.
  - `auth` — `packages/auth` (`@blog/auth`): the Auth.js configuration both
    apps pass to their own `NextAuth()` call (providers, the Drizzle adapter,
    session strategy, cookie options). A thin layer above `db`, which owns the
    adapter tables — and `db` must never import it. It exports configuration,
    never a constructed NextAuth instance, so each app keeps its own request
    context. Establishes identity only; authorization stays each app's call.
  - `ui` — building the pure, publishable `@blog/ui` design system.
  - `web` — App Router routes, SEO, composition of `ui` + `service` + `db`.
  - `platform-app` — `apps/platform`, the operator/tenant admin panel: a second Next.js
    app with its own deployment and domain, gated by the session `apps/web`
    already issues. A sibling to `web`, not a step after it — its upstreams are
    `config`, `db`, and `ui` only, so it never waits on `studio`/`service`, which
    it must not import. Interactive primitives come from Base UI installed in
    that app and styled with the shared Tailwind tokens; nothing is added to
    `@blog/ui` for it (a component with one consumer isn't shared — the same
    call #1157 made for `apps/web` page sections). Its "Start here" names the
    three admin design documents — the product-design spec (intent), the
    interactive mock (approved information architecture and layout), and the
    corrections brief (real token values, and the defects the mock still
    contains) — as required reading before any visual work, whether or not a
    dispatch cites them. Naming them in the agent rather than the dispatch is
    deliberate: built from the product spec alone, which carries no concrete
    values by design, a surface passes every acceptance criterion and still
    ships as a wireframe. It also owns this app's audit-trail duty:
    operator-initiated lifecycle mutations record a durable `audit_events` row
    via `recordAuditEvent`, gated on the mutation actually having succeeded —
    auditing is a separate concern from logging, and a false record is worse
    than a missing one.
  - `email` owns `packages/email` (`@blog/email`) — the single home for every
    email the product sends: the shared branded HTML shell, the canonical
    `escapeHtml`, and the typed `sendEmail` Resend transport. It sits low in
    the graph (`@blog/utils` only) so both apps, `@blog/auth` and `@blog/db`'s
    CLI scripts can all consume it without a cycle, and it is side-effecting by
    design — it owns the send call — while never logging and never resolving
    tenants or fetching content itself. Its own agent exists because HTML email
    inverts normal front-end instincts (inlined styles only, table layout, no
    JSX, escape every interpolated value) and because operator-alert copy must
    never become tenant-editable — a trust boundary, since those alerts are how
    a broken provisioning run gets noticed.
  - Those ten layer agents (`config`, `studio`, `service`, `ui`, `web`, `db`,
    `platform-app`, `auth`, `insight`, `email`) additionally carry the two context7 MCP tools
    (`resolve-library-id`, `query-docs`) in their `tools:` frontmatter, so the
    `use-context7` skill is actually executable by the agent that hits an
    unfamiliar library API mid-implementation. Without them the instruction to
    check live docs was unfollowable, and an agent asked to verify a Base UI
    contract substituted a raw `curl` of the vendor's docs site instead. The
    read-only agents below are deliberately not granted them — they review and
    report rather than implement against an API.
  - `verify-runner` — read-only, Haiku-model runner for the integration
    verify pass (`develop-feature` §5: `type-check`/`lint`/`test`,
    the exact scenario-specific sequence it's given). `build` is not part of
    the routine sequence — CI's `ci.yml` `build` job gates every PR, so a
    local re-run would just duplicate it; `verify-runner` still runs `build`
    on request when reproducing an actual CI build failure
    (`open-pull-request` Gate 5a). Dispatched in the background, like every
    other subagent, right before step 6's review — the orchestrator resumes
    on its completion notification rather than waiting synchronously. Runs
    each command in order,
    stops at the first failure, and reports which command failed plus
    trimmed output — no root-cause diagnosis or fix suggestion. Never given
    `pnpm typegen`: that mutates generated files, which its read-only guard
    denies, so typegen still runs inline in the orchestrator's own session
    first. That replaces running the verify commands directly in the
    orchestrator's own turn, which put `turbo run type-check`/`lint`/`test`
    output across up to 11 packages permanently into its context for a
    purely mechanical pass/fail job.
  - `reviewer` — read-only pre-commit review of the full diff; gates the
    commit ask on an `APPROVE` verdict. Trusts `verify-runner`'s already-passed
    `type-check`/`lint`/`test` result rather than re-running it.
  - `a11y-reviewer` — read-only accessibility audit of
    `packages/ui`/`apps/web`/`apps/platform` diffs against
    `ui-library-practices`' non-negotiable rules; dispatched alongside
    `reviewer` whenever a diff touches those layers.
  - `explore` — read-only discovery scout (Haiku). Answers "where is X / how
    does Y work" sweeps in a cheap, disposable context and returns conclusions
    with `file:line` pointers instead of file dumps, so the orchestrator's
    window isn't spent rediscovering the codebase.
  - `test-writer` — adds/extends co-located `*.test.ts(x)` coverage after the
    layer agents finish implementing, so test quality doesn't depend on each
    layer agent's leftover attention at the end of its run. Scoped to test
    files by **enforcement** (#396) on both tool surfaces it has: a
    `PreToolUse` guard (`test-writer-scope-guard.sh`) denies any `Edit`/
    `Write` outside `*.test.ts(x)`, and `permissionMode: dontAsk` +
    `read-only-agent-guard.sh` (reused as-is from `reviewer`/`explore` below)
    denies the same write-shaped `Bash` commands — closing the `mv`/`cp`
    bypass that would otherwise move or overwrite a file outside the
    Edit/Write check entirely. A needed product-code change comes back as a
    finding for the orchestrator to route, never a fix this agent makes
    itself. Sees the product change it's covering via the same "Sequential
    agent worktrees compose" mechanism below (#1796) rather than any seeding
    step of its own — the orchestrator must land the layer agent's commit
    first. The fail-without-the-fix check for a regression test is likewise
    the orchestrator's job: `test-writer` cannot revert product code under
    any tool, so it cannot run that check itself (`develop-feature` §4).
  - `seo-auditor` — read-only SEO/metadata audit of the full diff, dispatched
    alongside `reviewer` (never instead of it) whenever a change touches
    `apps/web` routes, metadata, structured data, or feeds. Applies the
    `seo-and-metadata` skill as a checklist (`generateMetadata` completeness,
    JSON-LD validity, sitemap/robots/RSS coherence) and reports a verdict in
    the same `APPROVE` / blocking / non-blocking / not-checked format.
  - `board-keeper` — creates new issues and reconciles the Blog Build
    project board against repo reality (open PR → issue in Code Review,
    in-flight branch → In Progress, merged PR → issue Done, a completed
    parent issue whose sub-issues all trace to merged PRs → Done, every
    open issue/PR carries at least one label, every open issue carries
    exactly one `prio:*` label per `CLAUDE.md`'s "Ticket priority & triage"
    section — a creation dispatch without one is rejected as incomplete,
    and a sweep flags open issues carrying zero or two-plus `prio:*`
    labels). Also propagates parent/epic
    status both ways: a parent still `Todo` moves to In Progress the moment
    any of its sub-issues does, and a parent whose sub-issues are all
    complete but is still open gets flagged (not auto-closed — closing an
    issue stays a judgment call) rather than sitting unnoticed. Issue
    creation is a single choke point — the orchestrator never calls
    `gh issue create` directly;
    it dispatches `board-keeper` with a fully-specified title/body/labels
    (and a parent issue number if it's a sub-issue), which creates the
    issue, places it on the board, and confirms status/labels/parent-link
    as one verified operation, so creation and placement can never be
    decoupled into a forgettable second step. Re-queries every status write
    it makes to catch `gh project item-edit`'s known silent-failure mode,
    runs a three-step preflight before any board write — is `gh` installed,
    is the GraphQL API reachable, does the token carry the `project` scope —
    and reports the three outcomes distinctly rather than collapsing them.
    A web/remote session has no `gh` binary and serves only a pinned set of
    PR-review GraphQL operations, so Projects v2 (GraphQL-only, no REST
    equivalent) is unreachable there whatever the token carries; that is
    reported as outstanding board work rather than misdiagnosed as a missing
    scope, and the MCP-backed half of the dispatch — issue creation, labels,
    milestones, sub-issue links — still completes. It also reports
    destructive-looking moves (e.g.
    reopening a wrongly-closed issue) for the orchestrator instead of
    applying them. Dispatched to create any new issue, when starting work on
    an issue (`open-pull-request` Gate 0 — sets the issue itself to In
    Progress and promotes a Todo/blank parent in the same dispatch,
    synchronously, since branch checkout depends on the result), after every
    PR open/merge, and on demand. Targeted triggers — creation, start-of-work,
    after-PR, after-merge, after-filing — are cheap, single-issue checks by
    default and do not cascade into a full board sweep — append "...also
    reconcile the board" to opt in, or dispatch it bare with no issue number
    for an unconditional full sweep. Measured: a targeted check runs 15-100s,
    a full sweep 100-450s.
  - `ci-watcher` — read-only, Haiku-model watcher for a single PR's CI
    checks (#464). Dispatched in the background right after `open-pull-request`
    Gate 5, with the PR's actual number (never the issue number or a bare
    branch) so it needs no worktree/branch context of its own. Checks the
    PR's `mergeable` status before watching anything — a `CONFLICTING` PR has
    no merge ref, so most required checks never trigger and `gh pr checks`
    would otherwise report a false green on whatever partial set did run
    (#2578); it stops and reports the conflict instead of a checks verdict.
    Once mergeable, runs `gh pr checks <n> --watch` to a terminal state,
    sanity-checks the total count against this repo's normal ~20-22 (flagging
    a suspiciously low one rather than silently accepting it), and reports
    pass/fail — on failure, the check name, run/job URL, and a raw
    `--log-failed` excerpt, handed back as data with no root-cause diagnosis
    or fix suggestion. That replaces running `--watch` synchronously in the
    orchestrator's own turn, which measured ~3,000–3,500 tokens of polling
    output landing permanently in its context (paid again every turn until
    compaction) and blocked the session for the minutes CI took.

  `reviewer`, `a11y-reviewer`, `seo-auditor`, `explore`, `ci-watcher`, and
  `verify-runner` are read-only by **enforcement**, not just prose (#425,
  #464, #466); `test-writer` reuses the same `Bash` guard although it isn't
  fully read-only (#396). All seven run under `permissionMode: dontAsk`, plus
  a per-agent `PreToolUse` guard (`read-only-agent-guard.sh`) that denies the
  write-shaped commands the project allow-list would otherwise admit
  (`git commit` — including with leading global flags like `git -C dir
commit`, `mkdir`, `cp`, `mv`, `tee`, `pnpm typegen`, `pnpm exec`/
  `pnpm --filter ... exec`, …) plus `sed -i`/`--in-place`, `perl -i`, and
  shell redirection (`>`, `>>`, and their fd-qualified forms) to anything
  other than a harmless sink like `/dev/null` or an fd duplication
  (`2>&1`).

  **`dontAsk` does not itself fail closed on every command that would
  otherwise prompt — this project previously documented it as if it did,
  and #1797 found that wrong for real.** `dontAsk` runs a command unprompted
  whenever it matches `permissions.allow`, is approved by a `PreToolUse`
  hook, **or** the harness's own built-in classification judges the command
  safely read-only — that third path is not something this project
  configures, and it is not sound: a `test-writer` agent ran `sed -i`
  against a real product file, unprompted and unblocked, because the
  harness's own heuristic treated `sed` as an ordinary read/text-processing
  command without accounting for the `-i` flag turning it into a write.
  `perl -i`, `tee`, and shell redirection are the same class of
  misjudgment. `read-only-agent-guard.sh` is therefore the actual
  enforcement for every write-shaped command it lists — full stop,
  regardless of what `dontAsk`'s own classifier would have done on its
  own — not a mop-up for a small residue `dontAsk` already caught.

  Redirection detection (`>`/`>>` and their fd-qualified/`&`-combined
  forms) pads a space around every match before tokenizing, so it catches
  the operator whether it's glued to its target, its preceding word, both,
  or neither (`echo hi>file`, `echo hi >file`, `echo hi> file`, `echo hi >
file` are all denied alike) — an earlier version only handled the
  fully-spaced form and missed the other three, which #1797's review
  caught as covering far less than intended.

  Residual, accepted: commands that execute package scripts the allow-list
  doesn't flag as write-shaped (`pnpm test`, `pnpm dev`, `turbo run`) can
  still write; and the guard's quote-naive segment splitting can
  false-positive on search patterns containing e.g. `&& mkdir ` — denials
  tell the agent to fall back to Grep/Read. This is a
  guardrail against honest confusion, not a security boundary — it doesn't
  chase further obfuscation (case-insensitive filesystem tricks,
  path-qualified binaries, wrapper commands); see #397 for why full
  adversarial-proof text-level enforcement was rejected as not worth its
  false-positive cost.

- **Hooks** (`.claude/hooks/`):
  - `post-edit-prettier.sh` → `post-edit-lint.sh` — `PostToolUse` hooks (wired
    in `.claude/settings.json` as a single chained command,
    `post-edit-prettier.sh && post-edit-lint.sh`) so every agent-edited/written
    file is Prettier-formatted, then linted on the formatted content, in the
    same turn. They're chained rather than two entries under the same
    matcher because Claude Code runs all hooks matching an event in
    parallel — two array entries would race and ESLint could see pre-format
    content. `post-edit-prettier.sh` always exits 0 and gives no agent
    feedback (formatting, not review); unsupported/missing files and
    `.prettierignore`'d paths are silent no-ops via Prettier itself.
    `post-edit-lint.sh` lints every agent-edited `.ts`/`.tsx` file and feeds
    errors — including layer-boundary `no-restricted-imports` violations —
    back to the agent. Report-only (never `--fix`); the commit-time gates
    (lint-staged) stay authoritative.
  - `pre-bash-worktree-install-guard.sh` — `PreToolUse` hook that blocks
    dependency-mutating pnpm commands inside a shared-deps agent worktree
    (see below) before pnpm can write anything.
  - `gate-bypass-guard.sh` — `PreToolUse` hook, wired **globally** in
    `.claude/settings.json` (every agent's `Bash` calls, not one agent's —
    bypass commands could come from any context, including the
    orchestrator). Blocks the plain, unobfuscated forms of `git` commands
    that skip the husky gates or rewrite pushed history: a literal
    `--no-verify`/`-n` on `commit`/`push`/`merge`, a literal
    `--force`/`-f`/`--force-with-lease`/`+refspec` on `push`, and
    `core.hooksPath` on `git config`. A quote-aware tokenizer (not a regex
    over the raw string) keeps a quoted commit message — including this
    repo's own multi-line `-m "$(cat <<'EOF' ... EOF)"` convention — as one
    value token that can never be misread as a flag; that distinction is
    what a discarded, more ambitious first attempt at this hook (#397) got
    wrong before it was fixed. That attempt chased ~15 real bypasses across
    five review rounds and was discarded anyway, because its false-positive
    rate on honest commands (it blocked its own commit message for merely
    mentioning `--no-verify`) cost more than the shortcuts it prevented. This
    version deliberately does not chase further obfuscation — env var
    indirection, shell recursion, case-insensitive filesystems,
    path-qualified binaries, wrapper commands, clustered short flags,
    quote-splitting, backslash-newline continuations — same posture as
    `read-only-agent-guard.sh` below. `gate-bypass-guard.test.sh` pins the
    deny/allow matrix, reusing the discarded attempt's proven
    legitimate-command bank; run it directly or via CI (see
    [`docs/context/ci-automation.md`](./ci-automation.md)).
  - `read-only-agent-guard.sh` — `PreToolUse` hook (wired in the `reviewer`,
    `a11y-reviewer`, `explore`, `seo-auditor`, `ci-watcher`, `verify-runner`,
    and `test-writer` agent frontmatter — `test-writer` sets a `GUARD_LABEL`
    env var on its hook command so the deny message names it correctly
    rather than calling it "read-only")
    backing the enforcement described above. Its `DENY_PREFIXES` list
    mirrors the write-shaped entries in `settings.json` `permissions.allow`
    — keep the two in sync. The `sed`/`perl` in-place-edit and redirection
    checks (#1797) are the deliberate exception: those shapes have no single
    allow-list prefix to mirror (`sed -i` vs. `sed -n`, `cmd > file` vs.
    `cmd > /dev/null`), so they get their own narrow, targeted detection
    functions instead of a prefix-list entry. `read-only-agent-guard.test.sh`
    pins the deny/allow matrix (including the bypasses found across #425's
    review rounds and the in-place/redirection cases added for #1797); run it
    directly or via CI (see [`docs/context/ci-automation.md`](./ci-automation.md)).
  - `test-writer-scope-guard.sh` — `PreToolUse` hook (wired in the
    `test-writer` agent frontmatter) that denies any `Edit`/`Write` whose
    target isn't `*.test.ts`/`*.test.tsx`, backing the test-file-only scoping
    described above.
  - `pre-agent-gate0-guard.sh` — `PreToolUse` hook on the **`Agent` tool**
    (wired in `settings.json`, not in agent frontmatter, since it must see
    dispatches before any agent starts). Denies dispatching a **layer agent**
    (`config`/`studio`/`service`/`ui`/`web`/`db`/`platform-app`/`auth`/`insight`/`email`) to implement an issue that
    isn't `In Progress` on the board — i.e. Gate 0 was skipped. The deny
    message names the fix (dispatch `board-keeper` with
    `"starting work on #<n>"`).

    Exists as a hook rather than more `CLAUDE.md` prose because the rule is
    written as step 1 of a _lifecycle_ while the failure happens on a single
    _action_: Gate 0 gets run when the orchestrator consciously enters
    "shipping an issue" mode and skipped when a dispatch emerges from
    conversational momentum (decision → spec → tickets → dispatch).
    `CLAUDE.md` already carries two emphatic prose warnings about
    structurally identical traps, so a third had no reason to work better.

    Deliberately narrow, same posture as `read-only-agent-guard.sh` — a guard
    that fires on honest work gets disabled and then protects nothing:

    - Only layer agents are checked; reviewers, `explore`, `board-keeper`,
      `ci-watcher` and `verify-runner` pass straight through.
    - Only the `Implement issue #<n>` phrasing counts as an implementation
      target. Dispatch prompts routinely cite other issues as context
      (parents, siblings, superseded work), so matching every `#<n>` would
      block on whichever number appeared first.
    - No issue named → allow. Plenty of legitimate layer work isn't ticketed.

    **Fails open** when `gh`/`jq` is missing, the board query errors, or the
    issue isn't on the board: it warns on stderr and allows. A guard that
    bricks every dispatch on a transient network blip is worse than none,
    because it gets removed. `pre-agent-gate0-guard.test.sh` pins the matrix
    with a stubbed `gh` on `PATH`, so it is hermetic — no network, no
    dependence on live board state.
- **Repo-specific ESLint rules** (`configs/eslint/`) — `no-prop-spread.js` and
  `boolean-prop-prefix.js` are the repo's only hand-written rules (with a
  `create()` visitor). They sit alongside two `no-restricted-imports` helpers
  that are configuration rather than rules: `no-upstream-imports.js`, a
  flat-config preset blocking a base-of-the-graph package from importing
  `@blog/service`/`@blog/ui`, and `no-vitest-globals-import.js`, a shared
  `paths` entry banning redundant value imports of Vitest's globals, which
  every config declaring its own `no-restricted-imports` must spread in —
  flat config replaces a rule's options wholesale rather than merging them.

  The two rules matter to agents specifically because `post-edit-lint.sh`
  surfaces their violations in the same turn as the edit, so a convention
  breach is corrected before it reaches review:
  - `no-prop-spread.js` — bans `{...rest}` spread onto a JSX element in
    `@blog/ui`. Registered in `ui.js` only. `@blog/ui` prop types are closed
    and enumerated, so a spread promises a surface `tv()` never styles: the
    bug that motivated it was a `TextInput` accepting every native `<input>`
    attribute while visibly honouring almost none of them. The six
    polymorphic components that legitimately forward a caller-chosen
    element's props are an explicit filename allowlist inside the rule — not
    inferred from `TPolymorphicProps`, since `Eyebrow` is polymorphic without
    using it. `*.test.tsx`/`*.stories.tsx` are out of scope: they consume
    component APIs rather than define them, and their spreads land on local
    mock components.
  - `boolean-prop-prefix.js` — requires boolean members of `T*Props`/`I*Props`
    to start with `is`/`has`/`can`/`should` (`prefetch`/`priority` allowlisted
    as third-party passthrough names). Registered in `ui.js`, `web.js`, and
    `admin.js`. This cannot be `@typescript-eslint/naming-convention`: its
    boolean form needs `types: ['boolean']` and therefore type-aware linting,
    which `base.js` does not enable. Reading the declared annotation
    syntactically catches most cases, because props here are always annotated
    — and it buys something the built-in rule cannot do, scoping by enclosing type
    name so a `TResult`'s `ok` discriminant is never touched. **Known blind
    spot:** a prop annotated with an indexed access into a variants type
    (`invalid?: TTextInputVariants['invalid']`) is `boolean` at runtime but
    is not a `boolean` _annotation_, so the rule cannot see it — resolving
    that needs the type information this repo does not enable. Seven such
    props exist in `@blog/ui`; renaming them is tracked in issue #1739.

  Both carry `RuleTester` unit coverage (`*.test.js`, run by `configs/eslint`'s
  `node --test` script, which `pnpm test` picks up).

  Only `no-prop-spread.js` is file-aware: it reads `context.filename` inside
  `create()` to apply its six-file allowlist and skip tests/stories. Keeping
  that next to the logic it governs is a locality choice, not a forced one —
  a workspace-relative glob would work too, since `ui.js` has exactly one
  consumer. Worth knowing before writing one anywhere shared, though:
  flat-config `files` globs resolve against the **consuming workspace**, not
  the repo root, so a root-relative override in a preset with several
  consumers silently matches nothing and the rule passes CI by never running.

  `boolean-prop-prefix.js` needs no file filtering at all. It scopes
  structurally, visiting only type and interface declarations whose name
  matches `T*Props`/`I*Props`, so file path is irrelevant to it. Where it
  applies is decided purely by which presets register it.

  That glob caveat is exactly what the third convention rule has to live with.
  `func-style` is a **built-in** rule, not one of the hand-written pair, but it
  reaches agents the same way — `web.js` registers
  `['error', 'expression', { allowArrowFunctions: true }]`, so `post-edit-lint.sh`
  flags a `function` declaration in `apps/web` in the same turn it is written.
  It has one wrinkle the custom rules don't: it cannot exempt by export **name**,
  and Next.js reserved exports (`generateMetadata`, `generateStaticParams`, the
  route verbs) must stay declarations. So the carve-out is a glob-scoped
  `func-style: 'off'` over `**/page.tsx`, `**/layout.tsx`, `**/route.ts`, and
  `**/not-found.tsx` — which silences those files wholesale, including any
  non-reserved local helper in them. The convention (`.claude/agents/web.md`
  § "Function style") still requires those helpers to be arrows; the linter
  simply cannot see them. `export default function` needs no carve-out at all:
  `expression` mode does not flag default exports, which is why every `Page`
  and `Layout` passes untouched.

- **Shared `node_modules` in agent worktrees** — a full `pnpm install` per
  isolated worktree duplicated ~1.1 GB and minutes of setup each time, so
  `.husky/post-checkout` seeds every new linked worktree instead (issue #410):
  - the root `node_modules` becomes a **symlink** to the primary checkout's
    copy — that directory holds pnpm's content-addressed `.pnpm` store, i.e.
    every external package;
  - each workspace `node_modules` is a tiny **copy of pnpm's symlink farm**
    (`cp -RP`). pnpm's links are relative, so `@blog/*` resolve to the
    _worktree's own source_ while external packages resolve through the root
    symlink into the primary checkout's store. A fresh worktree costs ~80 MB
    (source + farms) instead of ~1.2 GB, and removal is fast.
  - `apps/web/next.config.ts` anchors `turbopack.root` at the checkout that
    physically hosts the dependencies (via `realpath` of `node_modules`) —
    Turbopack otherwise refuses to resolve through a symlink that leaves its
    project root. In the primary checkout and on Vercel this resolves to the
    workspace root, exactly what Turbopack infers anyway.
  - **Installing inside a shared worktree is unsupported** — pnpm follows the
    root symlink, so `pnpm install`/`add`/... would prune and rewrite the
    _primary checkout's_ dependencies. Three layers prevent it: the
    `PreToolUse` hook blocks agent-issued pnpm mutations up front, the root
    `preinstall` script (`scripts/guard-worktree-install.mjs`) aborts any
    install that slips through before pnpm links anything, and pnpm itself
    prompts before reusing a virtual store created at another path. On a
    branch that must change dependencies, give the worktree a private tree:
    `rm node_modules` (removes only the symlink) then `pnpm install`.
  - Why not the harness's `worktree.symlinkDirectories` setting: it can only
    symlink whole directories, which works for the root but would point the
    workspace-level `node_modules` at the primary checkout — and their
    `@blog/*` links would then resolve to the _primary checkout's source_,
    silently building stale code. The `post-checkout` hook produces the
    farm copies the pnpm layout needs, covers manually created worktrees
    too, and keeps a single mechanism in charge.
- **Sequential agent worktrees compose via `worktree.baseRef: "head"`**
  (`.claude/settings.json`) — every layer-agent and `test-writer` dispatch
  carries `isolation: worktree` in its own frontmatter, and this setting means
  each new worktree branches from the **orchestrator's current local `HEAD`**,
  not from `origin/<default-branch>`. So dispatching agent B after agent A only
  sees A's work if A's commit was landed onto the orchestrator's local branch
  first (`git merge --ff-only <sha>` when B branches from the same tip A did,
  `git cherry-pick` if `HEAD` moved since — e.g. parallel agents, or an
  intervening `pnpm typegen` commit) — a bare "agent A's turn finished" is not
  enough. This is what makes `test-writer` (`develop-feature` §4) able to see
  the product change it was dispatched to cover without any seeding step of
  its own: it has no sanctioned way to pull in a file itself (`cp`/`mv` are
  denied, and the mutating `git` subcommands it would need are either on
  `read-only-agent-guard.sh`'s deny list or absent from `permissions.allow`
  entirely, so `permissionMode: dontAsk` fails closed on them) — the
  orchestrator landing the commit first is the only mechanism, not a
  workaround for one (#1796; the earlier workaround — racing a `cp` into the
  worktree before the agent's first turn read the files — was timing-dependent
  and has been retired). Cleanup after push:
  `git cherry origin/<feat-branch> <agent-branch>` (patch-id based, not
  `rev-list --count`, since a rebase changes SHAs but not patches) confirms an
  agent's worktree branch is fully landed before it's removed
  (`develop-feature` §8).
- **Worktree ownership across parallel sessions** — `.claude/worktrees/` is
  shared by every Claude job running against this checkout, so
  `git worktree list` mixes one session's worktrees with other jobs' live
  ones. The harness locks each worktree it materializes, recording the owner
  and pid in `$(git rev-parse --git-common-dir)/worktrees/<name>/locked`
  (e.g. `claude session fix-1788-storybook-fonts (pid 76582 start …)`), and
  `git worktree remove` refuses a locked path outright
  (`fatal: cannot remove a locked working tree`). That refusal is the safety
  net: `-f -f` or
  `git worktree unlock` on another job's worktree destroys its uncommitted
  work. `develop-feature` §8 is the teardown procedure — remove only the
  worktrees the current session created, checked against the lock file first.

- **Env files in agent worktrees** (issue #404) — the same
  `.husky/post-checkout` hook copies `.env.local`/`.env.*.local` from the
  primary checkout into every new linked worktree, so `pnpm build` works
  there without an agent ever touching a real env file directly (the deny
  rules in `.claude/settings.json` block `Bash(cp *.env*)`/`Bash(mv *.env*)`
  and Read/Edit/Write on `.env.local` — the hook runs as a git subprocess,
  invisible to and unaffected by that permission layer). Verified end-to-end:
  a fresh worktree gets seeded and `pnpm --filter web build` passes green
  inside it, deny rules active throughout.
  - **Edge case:** a worktree created before husky's hooks are wired up
    (i.e. before `pnpm install` has ever run once in the primary checkout —
    `prepare: husky` in the root `package.json` is what wires them) is
    created **unseeded**, and an agent cannot self-heal — the deny rules
    block a manual `cp`/`mv` with no prompt. The resulting build failure is
    an ordinary missing-env-var error from Next.js/Sanity (a structured
    `@t3-oss/env-nextjs` "Invalid environment variables" message naming the
    missing key), not a mystery stack trace; if you hit one in a worktree,
    first check whether `apps/web/.env.local` exists there at all. Fix is
    human-only: run `pnpm install` once in the primary checkout (wires the
    hooks), then either re-create the worktree, or — since hooks are shared
    across worktrees via the common `.git` dir — trigger a re-seed in the
    existing one with any `git checkout` (the hook skips already-present
    files, so it only fills the gaps).

- **Skills** (`.claude/skills/`):
  - `develop-feature` — the lifecycle playbook (investigate → delegate per layer → test → review → commit → remove the subagent worktrees); start here for non-trivial work.
  - `add-content-type` — end-to-end recipe spanning all layers (schema → types → service → ui → web).
  - `studio-schema-practices` — Sanity schema quality bar + content-migration workflow.
  - `ui-library-practices` — building pure, prop-driven design-system components.
  - `web-component-practices` — building interactive `apps/web` components (compose `@blog/ui` via slots, client behaviour in ref-based hooks).
  - `ui-storybook` / `web-storybook` — Storybook conventions per workspace.
  - `testing-practices` — Vitest + Testing Library conventions.
  - `seo-and-metadata` — per-route metadata, JSON-LD, sitemap/robots/RSS.
  - `code-review-practices` — boundary/type/SEO/test checklist before a PR.
  - `refactor-sweep` — on-demand, layer-scoped cleanup audit (duplication,
    dead code, convention drift); files findings as tracked issues, never
    edits directly. Micro-findings batch into one per-layer umbrella issue
    per sweep instead of one issue each; every filed issue defaults to
    `prio:later` (`prio:someday` if speculative) and gets `cloud-ok` when it
    meets the solo-cloud-session criteria. No fixed cadence — run whenever
    asked, naming the layer.
  - `open-pull-request` — branch → work → PR with human-gated push/PR steps.
  - `use-context7` — fetch live, version-matched library docs before guessing.
  - Plugin skills (provisioned via `.claude/settings.json`, see below):
    `superpowers:systematic-debugging`, `superpowers:test-driven-development`,
    `superpowers:verification-before-completion`, `superpowers:writing-skills`,
    `superpowers:brainstorming` and `superpowers:using-git-worktrees` (invoked
    by `develop-feature`), `vercel:nextjs`, `vercel:next-cache-components`,
    `vercel:deployments-cicd`, `frontend-design:frontend-design`.
- **Settings** (`.claude/settings.json`) — permission allowlist for the standard
  pnpm/turbo/sanity/git/gh commands and hook wiring; deploys and hand-edits to
  the generated Sanity types (`packages/config/src/sanity/generated/`, regenerate
  via `pnpm typegen`) are denied, as are reads/writes of real env files
  (`.env`, `.env.local`, `.env.*.local`) — the tracked `.env.example` templates
  stay readable and editable so agents can maintain them. It also provisions
  plugins via `extraKnownMarketplaces` + `enabledPlugins`, so a fresh clone
  resolves them without per-person setup: **context7** (required by the
  `use-context7` skill), **superpowers** (required by `develop-feature` and
  the plugin skills above), **frontend-design**, **typescript-lsp**,
  **vercel**, **code-simplifier**, **claude-md-management**, **skill-creator**,
  **code-review**, **feature-dev**, **security-guidance**,
  **claude-code-setup**, **playwright**, and **sanity** — all from the single
  `claude-plugins-official` marketplace. Because the `vercel` plugin bundles a
  `/deploy` command and `deployment-expert` subagent that can trigger a real
  deploy, the deny list also blocks the underlying `vercel --prod` /
  `vercel deploy --prod` / `vercel promote` / `vercel rollback` commands and
  the `deploy_to_vercel` MCP tool, so enabling the plugin can't bypass this
  repo's human-gated deploy policy. Opt out locally in
  `.claude/settings.local.json`.
- **`.mcp.json`** (project root) — declares the `github` MCP server (Copilot's
  hosted `https://api.githubcopilot.com/mcp` endpoint), authenticated with a
  static `Authorization: Bearer ${GITHUB_PAT}` header rather than OAuth —
  GitHub's auth server doesn't support the dynamic client registration
  Claude Code's automatic MCP login needs. Each contributor exports their own
  `GITHUB_PAT` (a GitHub personal access token) in their shell profile; never
  put the token value in this repo. Cloud runs have no shell profile to read,
  so `claude.yml` supplies the same variable from the `GH_PAT` Actions secret
  (see [`docs/context/ci-automation.md`](./ci-automation.md)) — without it every `mcp__github__*` tool is
  silently absent from the run. That server also exposes write tools this
  repo's gates reserve for a human or for local git, so the deny list blocks
  eight of them: `create_pull_request`, `merge_pull_request` and
  `pull_request_review_write` (opening, merging and approving are the human's
  calls); `create_or_update_file`, `push_files` and `delete_file` (committing
  through the API skips commitlint, lint-staged and the push gate); and
  `create_repository` / `delete_repository`. `create_pull_request` matters
  most: a local session's `gh pr create` prompts for approval, so without the
  denial the MCP call is an unprompted way around the same gate. The
  issue tools `board-keeper` depends on — `issue_read`, `issue_write`,
  `sub_issue_write` — stay permitted, as does `pull_request_read`, which
  `ci-watcher` uses.
- **Scheduled cloud routines** — a Claude Code "routine" (`/schedule`, backed
  by the `RemoteTrigger` API — cloud infrastructure, not a local cron job)
  runs daily and posts a summary of what merged in the last 24 hours, plus a
  retrospective code-review pass on any code-touching PR. It is read-only end
  to end (no `gh pr comment`, no file writes, no git commits) — the summary is
  delivered only via the routine's own push/email notification. See
  `docs/routines/release-notes-drafter.md` for the full prompt, current
  enabled/disabled status, and incident history; that file is a
  version-controlled reference copy, so editing it has no effect on the live
  routine — update both places if the prompt changes.
- **`gh` CLI extensions** — `github/gh-stack` (`gh stack`) is installed for
  stacked pull requests, and is the supported way to create them: `init`,
  `add`, `submit`, `sync`, `view`. Prefer it over hand-rolling bases with
  `gh pr create --base <branch>`, mainly for `sync`, which restacks the
  branches above a PR once it merges. Stacking is what makes a per-layer
  split viable for a change whose layers cannot each merge to `main` green
  alone, since the intermediate states target their predecessor rather than
  `main`.

  A PR receives the full required suite whatever branch it targets. The seven
  workflows behind the twelve required checks — `ci.yml` (Type-check, Lint,
  Test, Build, Typegen, Migrations) plus `knip.yml`, `dependency-review.yml`,
  `zizmor.yml`, `actionlint.yml`, `commitlint.yml` and `hooks.yml` (one each)
  — each declare a bare `pull_request:` trigger with no `branches:` filter,
  which is what makes stacking usable. Keep it that way: each file scopes its
  own trigger, so re-adding `branches: [main]` to any one of them drops that
  workflow's checks from every stacked PR, and because these are _required_
  checks the PR then hangs on `BLOCKED` rather than failing. That is the same
  deadlock `ci.yml`'s header comment describes when explaining why it carries
  no `paths-ignore`. (CodeQL is not among the twelve — it runs from GitHub's
  default code-scanning setup on a schedule, not from a workflow file, and is
  enforced by a separate `code_scanning` ruleset rule rather than as a
  required status check.)

- **`CLAUDE.md`** — repo-wide guidance loaded into every session.
