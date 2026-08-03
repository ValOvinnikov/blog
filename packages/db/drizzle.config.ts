import { defineConfig } from 'drizzle-kit';

// drizzle-kit's CLI (`db:generate`/`db:migrate`/`db:studio`) runs standalone
// via `pnpm --filter @blog/db db:*`, outside of Next.js's own env loading —
// so it expects DATABASE_URL_UNPOOLED to already be in the process
// environment. Locally that means sourcing it from apps/web/.env.local (the
// single local source of these Neon connection strings) before running a
// script, from the repo root, e.g.:
//
//   set -a && source apps/web/.env.local && set +a
//   pnpm --filter @blog/db db:generate
//
// This is a build-tool config file, not application code, so reading
// `process.env` directly here is the same exception next.config.ts /
// sanity.config.ts already take — the validated `src/utils/env/env.ts` entry
// point is for the runtime pooled connection (client.ts), not this file.
//
// No top-level throw when the var is absent: tools that statically import
// this file to introspect it (e.g. knip's Drizzle plugin, which resolves
// `schema`/`out` without ever connecting) must be able to load it with no
// Neon project configured at all. An actually-missing `dbCredentials.url`
// surfaces as drizzle-kit's own connection error the moment a `db:*` script
// really runs, which is early enough to be unambiguous.
const databaseUrlUnpooled = process.env['DATABASE_URL_UNPOOLED'];

if (!databaseUrlUnpooled) {
  console.warn(
    'DATABASE_URL_UNPOOLED is not set — db:generate/db:migrate/db:studio will fail to connect. See docs/context/environment-variables.md.',
  );
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrlUnpooled ?? '',
  },
});
