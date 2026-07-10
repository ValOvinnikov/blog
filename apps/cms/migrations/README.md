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

Each migration is its own folder, named for what it does:

```
apps/cms/migrations/
  <slug>/
    index.ts        # export default defineMigration({ ... })
  backups/           # dataset export backups — gitignored, see below
  README.md          # this file
```

`rename-author-role-to-job-title/index.ts` in this directory is an
**illustrative template**, not a real migration — read its header comment
before copying it. It shows the `defineMigration` / `at` / `set` / `unset`
API shape from `sanity/migrate` applied to a document-type field rename.

## Workflow

1. **Scaffold.** Run `sanity migrations create` from `apps/cms` (interactive —
   it will prompt for a title and migration type) or copy an existing folder
   under `migrations/` and rename it.
2. **Author the transform** in `<slug>/index.ts` using `defineMigration` from
   `sanity/migrate`. Prefer the `migrate.document` / `migrate.node` /
   `migrate.string` etc. node-visitor handlers for straightforward field
   transforms; drop to the async-iterable form only if you need custom
   iteration.
3. **Back up the dataset before any destructive run** (see Guardrails below):

   ```sh
   pnpm --filter cms dataset:export -- production migrations/backups/production-<date>.tar.gz
   ```

4. **Dry-run first.** Dry-run is the default for `sanity migrations run`, so
   this never touches the dataset:

   ```sh
   pnpm --filter cms migrate:dry -- <slug>
   ```

   Inspect the printed diff carefully — check the exact documents and fields
   that would change before going further.

5. **Only then run it for real**, once the dry-run diff looks correct and a
   backup exists:

   ```sh
   pnpm --filter cms migrate:run -- <slug>
   ```

   This passes `--no-dry-run` and will mutate the dataset.

6. **Regenerate types if the schema also changed:**

   ```sh
   pnpm --filter cms typegen
   ```

## Guardrails

- **Never run `migrate:run` (`--no-dry-run`) without a fresh `dataset:export`
  backup taken first.** If the migration does something unexpected, the
  backup is the only way back.
- **Migrations against `production` are human-gated, exactly like
  `sanity deploy`.** `apps/cms/sanity.cli.ts` defaults the CLI's project/
  dataset to `ccs8c2no` / `production`, so every command in this doc targets
  production unless `--project` / `--dataset` are overridden. An agent must
  **not** run `migrate:run` (or `dataset:export` / `migrate:dry` against real
  data) on its own initiative — that step needs an explicit human go-ahead,
  the same way a deploy does.
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

All commands below are run from `apps/cms` (or via `pnpm --filter cms <script>`
from the repo root). They use the Sanity CLI's plural `migrations` /
`datasets` topics.

```sh
# List available migrations
pnpm --filter cms migrate:list
# -> sanity migrations list

# Dry-run a migration (default; never mutates data)
pnpm --filter cms migrate:dry -- <slug>
# -> sanity migrations run <slug>

# Run a migration for real — human-gated, always back up first
pnpm --filter cms migrate:run -- <slug>
# -> sanity migrations run <slug> --no-dry-run

# Export a dataset backup before a destructive run
pnpm --filter cms dataset:export -- <destination>
# -> sanity datasets export production <destination>
```

Useful extra flags on `sanity migrations run`: `--project <id>` /
`--dataset <name>` to target a non-default dataset, `--confirm` /
`--no-confirm` to control the interactive confirmation prompt before a
non-dry run.
