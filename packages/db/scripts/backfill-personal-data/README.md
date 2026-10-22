# backfill-personal-data

Fills the encrypted and index columns for rows written before the
personal-data columns existed, or while the keys were unset:

| Table                | Encrypted                                                | Index         |
| -------------------- | -------------------------------------------------------- | ------------- |
| `users`              | `nameEncrypted`, `emailEncrypted`                        | `emailIndex`  |
| `subscribers`        | `email_encrypted`                                        | `email_index` |
| `membership_invites` | `email_encrypted`                                        | `email_index` |
| `leads`              | `name_encrypted`, `email_encrypted`, `message_encrypted` | `email_index` |

Each non-empty plain value gets an encrypted form under
`PERSONAL_DATA_ENCRYPTION_KEY`'s current key, and each email gets its index
under `PERSONAL_DATA_INDEX_KEY`: `accountEmailIndex` (the exact address) for
`users`, `personalDataIndex` (`+tag` dropped) for the rest. Rows are read in batches
of 500. A value already filled is kept, and a row whose plain value changes
mid-run is skipped and left for the next run, so running it again is always
safe — a second run finds nothing to do.

## Running it

Human-gated, like a migration: run it against development or production only
with the owner's go-ahead, after the expand migration
(`0055_add_personal_data_encrypted_columns`) is applied there, and with the
same two keys the apps use on that environment. Back the database up first
(`pg_dump` against `DATABASE_URL_UNPOOLED`) — the run only fills empty
columns, but a wrong key would fill them with values nothing can read.

```sh
set -a && source apps/web/.env.local && set +a
pnpm --filter @blog/db db:backfill-personal-data -- --dry-run
pnpm --filter @blog/db db:backfill-personal-data
```

`--dry-run` prints, per table, how many rows still need a value, and writes
nothing. A real run prints how many rows it backfilled per table, then runs
the same check and prints what is still missing. It exits non-zero when any
row still has a plain value without its encrypted form or index; run it again
to pick those rows up. Both keys must be set, or it refuses to start.
