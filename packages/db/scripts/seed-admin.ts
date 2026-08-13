/**
 * Grants an existing `users` row platform-admin access by inserting a row
 * into `admins`.
 *
 * MANUAL, HUMAN-RUN ONLY — never wired into CI or any deploy pipeline. Run
 * it by hand, once, against the target Neon branch:
 *
 *   set -a && source apps/web/.env.local && set +a
 *   pnpm --filter @blog/db db:seed-admin -- \
 *     --email=you@example.com \
 *     --role=SUPERADMIN|ADMIN|MODERATOR
 *
 * Idempotent: re-running with the same `--email` reuses the existing
 * `admins` row rather than failing — it does not update `role` on an
 * existing row, since regranting a different role is a distinct, deliberate
 * action. `--email` must already have a `users` row — this script does not
 * create one; the operator signs in once first (via the site's normal
 * Auth.js flow) so a real, correctly-linked account exists before it is
 * granted admin access.
 *
 * `db:seed-admin`'s `--conditions=react-server` node flag makes `getDb()`'s
 * `import 'server-only'` resolve to its no-op export outside Next.js's own
 * build (the condition Next.js itself sets), so this plain-Node script can
 * reuse the real query functions instead of duplicating their SQL.
 */
import {
  ADMIN_ROLE,
  GRANTED_VIA,
  type TAdminRole,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { createAdmin, getAdminByUserId } from '@blog/db/queries/admins';
import { users } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

type TParsedArgs = {
  email: string;
  role: TAdminRole;
};

function isAdminRole(value: string): value is TAdminRole {
  return (Object.values(ADMIN_ROLE) as string[]).includes(value);
}

function parseArgs(argv: string[]): TParsedArgs {
  const flags = new Map<string, string>();

  for (const arg of argv) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    if (!match) continue;
    flags.set(match[1] as string, match[2] as string);
  }

  function requireOne(key: string): string {
    const value = flags.get(key);
    if (!value) {
      throw new Error(`seed-admin: missing required --${key}=<value>.`);
    }
    return value;
  }

  const email = requireOne('email');
  const role = requireOne('role');
  if (!isAdminRole(role)) {
    throw new Error(
      `seed-admin: --role must be one of ${Object.values(ADMIN_ROLE).join(', ')}.`,
    );
  }

  return { email, role };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, args.email));
  if (!user) {
    throw new Error(
      `seed-admin: no "users" row for "${args.email}" — have them sign in to the site once first, then re-run this script.`,
    );
  }

  const existing = await getAdminByUserId(user.id);
  if (existing) {
    console.warn(
      `"${args.email}" is already an admin (${existing.role}) — leaving it as-is.`,
    );
    return;
  }

  const admin = await createAdmin(user.id, args.role, GRANTED_VIA.BREAK_GLASS);
  console.warn(`Granted ${admin.role} on "${args.email}".`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
