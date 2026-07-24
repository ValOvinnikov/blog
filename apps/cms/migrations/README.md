# Content migrations

This directory holds Sanity content migrations for the `cms` Studio. A
migration transforms **existing documents** in a dataset so they match a new
schema shape — it does the opposite job of typegen, which only regenerates
**TypeScript types** from the schema.

|             | Schema change (`typegen`)                       | Content migration                               |
| ----------- | ----------------------------------------------- | ----------------------------------------------- |
| Operates on | `src/schema-types/**`                           | Documents in a dataset                          |
| Output      | `packages/config/src/sanity/generated/types.ts` | Mutated documents (or a dry-run diff)           |
| Command     | `pnpm --filter cms typegen`                     | `pnpm --filter cms migrate:dry` / `migrate:run` |

**Both are needed for a field rename or restructure.** Changing a field in the
schema does not touch documents already in the dataset — old data is silently
orphaned unless a migration moves it to the new shape. Run the schema change
and typegen first, then write and run the migration so live data catches up.

## Layout

Each migration is its own folder, named for what it does, prefixed with the
UTC timestamp of when it was created (`YYYYMMDDTHHmm-<slug>`, e.g.
`20260710T1200-unify-links`) — this gives a deterministic, chronological run
order across migrations authored on different branches/dates:

```
apps/cms/migrations/
  <timestamp>-<slug>/
    index.ts        # export default defineMigration({ ... })
  backups/           # dataset export backups — gitignored, see below
  README.md          # this file
```

This directory currently holds **no migrations** — the datasets were recreated
clean, so the previously-applied transforms were removed. The tooling stays.
`migrate:new` scaffolds a new `<timestamp>-<slug>/index.ts` from a built-in
template (see the `template()` in `scripts/migrate.mjs`), which shows the
`defineMigration` / `at` / `set` / `unset` API shape from `sanity/migrate`.
Un-timestamped legacy folder names (from before this scheme) sort before every
timestamped one — see `scripts/migrate-lib.mjs` for the ordering rules.

## Workflow

1. **Scaffold + track.** `pnpm --filter cms migrate:new "<name>"` slugifies
   `<name>`, prepends the current UTC timestamp, creates
   `<timestamp>-<slug>/index.ts` from a template, and records it as the
   _current_ migration (in the gitignored `migrations/.current`), so the
   following steps don't need the id. If a migration with a matching slug
   already exists (regardless of its timestamp) it just tracks that one
   instead of creating a duplicate. (You can also `migrate:track <id>` an
   existing one, or omit the name to track the newest.)
2. **Author the transform** in `<slug>/index.ts` using `defineMigration` from
   `sanity/migrate`. Prefer the `migrate.document` / `migrate.node` /
   `migrate.string` etc. node-visitor handlers for straightforward field
   transforms; drop to the async-iterable form only if you need custom
   iteration.
3. **Back up the dataset before any destructive run** (see Guardrails below):

   ```sh
   pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz
   ```

4. **Dry-run first.** Uses the tracked migration (no id needed); dry-run never
   touches the dataset:

   ```sh
   pnpm --filter cms migrate:dry
   ```

   Inspect the printed diff carefully — check the exact documents and fields
   that would change before going further.

5. **Only then run it for real**, once the dry-run diff looks correct and a
   backup exists:

   ```sh
   pnpm --filter cms migrate:run          # prompts for confirmation
   ```

   This passes `--no-dry-run` and will mutate the dataset. In a
   **non-interactive/deploy** context add `--yes` (or set `CI=true`) to skip the
   prompt: `pnpm --filter cms migrate:run --yes`. Pass an explicit `<slug>` to
   any of these to override the tracked migration.

6. **Regenerate types if the schema also changed:**

   ```sh
   pnpm --filter cms typegen
   ```

## Deploying multiple pending migrations (`migrate:deploy`)

Steps 1–5 above walk through **one** migration at a time. `migrate:deploy`
automates running **every migration not yet applied** to a dataset, in order,
and records what ran so a second call is a no-op — this is the mechanism a
future gated deploy workflow will call post-merge (see `SPEC.md` §8; not wired
up yet — **today these are manual, local-only commands**, same human-gated
posture as `migrate:run`/`sanity deploy`).

It tracks what has already run in a per-dataset ledger document
(`_id: 'migrationState'`, `_type: 'migrationState'`) written via
`@sanity/client` — a system document, not a Studio schema type, so it's never
part of typegen and never shows up in the desk structure.

```sh
pnpm --filter cms migrate:deploy          # prompts for confirmation, then:
pnpm --filter cms migrate:deploy --yes    # non-interactive (or CI=true)
```

Algorithm: read the ledger for the resolved dataset → compute
`pending = sortedFolderMigrations - ledger.applied` → if none pending, exit 0
(no-op, safe to call on every deploy) → otherwise, for each pending migration
in order: **dry-run** (any error aborts the whole job before mutating
anything) → **run** (`--no-dry-run --no-confirm`) → append
`{ id, runAt, sha }` to the ledger. Stops on the first failure, so the ledger
always stays accurate up to the last migration that actually succeeded.

**Backfilling.** If migrations were already applied manually before this
ledger existed (or before you started tracking a dataset), record them as
applied **without re-running them**:

```sh
pnpm --filter cms migrate:backfill          # prompts for confirmation
pnpm --filter cms migrate:backfill --yes    # non-interactive (or CI=true)
```

This marks every currently-pending folder migration as applied in one
transactional ledger update — a no-op when the `migrations/` folder is empty
or everything is already recorded. Run it **once per dataset**, right after
adopting the ledger, so `migrate:deploy` doesn't try to re-apply
already-live changes.

Both commands need a write token — `SANITY_AUTH_TOKEN` (the same env var the
Sanity CLI itself authenticates from) or `SANITY_DEPLOY_TOKEN` as a fallback —
and `SANITY_STUDIO_PROJECT_ID`. Target a non-default dataset the same way as
every other command here (`SANITY_STUDIO_DATASET=development`); `production`
and `development` track applied migrations independently.

## Guardrails

- **Never run `migrate:run` (`--no-dry-run`) without a fresh `dataset:export`
  backup taken first.** If the migration does something unexpected, the
  backup is the only way back.
- **Migrations against `production` are human-gated, exactly like
  `sanity deploy`.** `SANITY_STUDIO_DATASET` defaults to `production` when
  unset, so every command in this doc targets production unless
  `SANITY_STUDIO_DATASET`/`--dataset` is overridden. An agent must **not** run
  `migrate:run`, `migrate:deploy`, `migrate:backfill` (or `dataset:export` /
  `migrate:dry` against real data) on its own initiative — that step needs an
  explicit human go-ahead, the same way a deploy does. `migrate:deploy` /
  `migrate:backfill` mutate data just like `migrate:run` — they are not exempt
  from this gate merely because they're batched.
- Dry-run (`migrate:dry`, i.e. `sanity migrations run` without
  `--no-dry-run`) is always safe to run — it never mutates data. Still
  requires an accurate backup workflow to exist so a human can act on the
  diff.
- `--from-export <file>` is only valid for dry runs — it lets you dry-run a
  migration against a previously exported snapshot instead of hitting the
  live dataset over the network.
- Dataset export backups are large and may contain real content. They are
  gitignored (`apps/cms/migrations/backups/`, `*.tar.gz`) — never commit
  them. `backups/.gitkeep` keeps the directory present in git without
  tracking its contents.

## Commands reference

Run from the repo root via `pnpm --filter cms <script>`. `migrate:*` and
`dataset:export` are backed by `scripts/migrate.mjs`, which resolves the target
migration (explicit name → tracked `.current` → newest) and the target dataset.

**Dataset selection.** The dataset comes from `SANITY_STUDIO_DATASET` (default
`production`) — `sanity.cli.ts` reads the same var, so `sanity dev` and the CLI
agree. Target another dataset by exporting it:

```sh
SANITY_STUDIO_DATASET=development pnpm --filter cms migrate:dry
```

The resolved dataset is printed before every dry-run / run / export.

```sh
pnpm --filter cms migrate:list            # list all migrations
pnpm --filter cms migrate:new "<name>"    # scaffold (timestamped id) or reuse + track
pnpm --filter cms migrate:track [id]      # track an existing one (default: newest)
pnpm --filter cms migrate:current         # print the tracked migration
pnpm --filter cms migrate:dry [id]        # dry-run the tracked/named migration
pnpm --filter cms migrate:run [id]        # apply it (prompts; --yes to skip)
pnpm --filter cms migrate:deploy          # run every un-applied migration (ledger); no-op if none pending
pnpm --filter cms migrate:backfill        # record all pending migrations as applied, without running them
pnpm --filter cms dataset:export [dest]   # backup (default dest: backups/<dataset>-<ts>.tar.gz)
```

For CI/deploy, `migrate:run --yes` (or `CI=true`) runs non-interactively — same
for `migrate:deploy --yes` / `migrate:backfill --yes`. To
target a non-default dataset ad-hoc without env, pass an explicit `--dataset`
through to the underlying `sanity migrations run`.

## Refreshing `development` from `production` (not a migration)

`pnpm --filter cms dataset:refresh-dev` (`scripts/refresh-dev-dataset.mjs`) is
a **different** tool from everything above — it doesn't transform documents in
place, it wholesale **replaces** the `development` dataset with a fresh
`--no-drafts` (published-only) export of `production`, including assets. Dev
and prod are separate Sanity **projects** (see `docs/DEPLOY.md`), so this is a
cross-project export/import, not `sanity dataset copy` (same-project only).

Run it manually, via the `Refresh Dev Dataset` GitHub Actions workflow
(`workflow_dispatch` only — never automatic), and only **after** confirming
that release's production migrations have already finished. The script's
`assertSafeDatasetRefresh` guard (`scripts/refresh-dev-dataset-lib.mjs`)
refuses to run unless the target is exactly `development` and the source/
target project ids are both present and different — it fails loudly before
any network call rather than risk writing into production.
