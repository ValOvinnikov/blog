/**
 * Seeds the tenant registry (`tenants`, `tenant_domains`, `memberships`)
 * for one tenant and grants an existing user the `OWNER` role on it.
 *
 * MANUAL, HUMAN-RUN ONLY — never wired into CI or any deploy pipeline. Run
 * it by hand, once, against the target Neon branch:
 *
 *   set -a && source apps/web/.env.local && set +a
 *   pnpm --filter @blog/db db:seed-tenant -- \
 *     --name="Acme" \
 *     --primary-domain=acme.example.com \
 *     --sanity-project-id=<project id> \
 *     --sanity-dataset=production \
 *     --locale=en \
 *     --owner-email=owner@example.com \
 *     [--plan=FREE|GROWTH] [--status=ACTIVE|SUSPENDED] \
 *     [--domain=extra.example.com ...] [--sanity-read-token=<token>]
 *
 * Idempotent: re-running with the same `--primary-domain` reuses the
 * existing tenant row instead of creating a duplicate, and every write below
 * (domain, membership) is itself a no-op-safe upsert. `--owner-email` must
 * already have a `users` row — this script does not create one; the owner
 * signs in once first (via the site's normal Auth.js flow) so a real,
 * correctly-linked account exists before it is granted a membership.
 *
 * `db:seed-tenant`'s `--conditions=react-server` node flag makes `getDb()`'s
 * `import 'server-only'` resolve to its no-op export outside Next.js's own
 * build (the condition Next.js itself sets), so this plain-Node script can
 * reuse the real query functions instead of duplicating their SQL.
 */
import { pathToFileURL } from 'node:url';

import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/db/constants';
import { createMembership } from '@blog/db/queries/memberships';
import {
  addTenantDomain,
  getTenantByDomain,
} from '@blog/db/queries/tenant-domains';
import { createTenant, setTenantSanityToken } from '@blog/db/queries/tenants';
import { users } from '@blog/db/schema/auth';
import type { TTenant } from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { eq } from 'drizzle-orm';

type TParsedArgs = {
  name: string;
  primaryDomain: string;
  sanityProjectId: string;
  sanityDataset: string;
  locale: string;
  ownerEmail: string;
  plan: TTenantPlan;
  status: TTenantStatus;
  extraDomains: string[];
  sanityReadToken?: string;
};

function isTenantPlan(value: string): value is TTenantPlan {
  return (Object.values(TENANT_PLAN) as string[]).includes(value);
}

function isTenantStatus(value: string): value is TTenantStatus {
  return (Object.values(TENANT_STATUS) as string[]).includes(value);
}

function parseArgs(argv: string[]): TParsedArgs {
  const flags = new Map<string, string[]>();

  for (const arg of argv) {
    const match = /^--([a-z-]+)=(.*)$/.exec(arg);
    if (!match) continue;
    const key = match[1] as string;
    const value = match[2] as string;
    flags.set(key, [...(flags.get(key) ?? []), value]);
  }

  function requireOne(key: string): string {
    const value = flags.get(key)?.[0];
    if (!value) {
      throw new Error(`seed-tenant: missing required --${key}=<value>.`);
    }
    return value;
  }

  const plan = flags.get('plan')?.[0] ?? TENANT_PLAN.FREE;
  if (!isTenantPlan(plan)) {
    throw new Error(
      `seed-tenant: --plan must be one of ${Object.values(TENANT_PLAN).join(', ')}.`,
    );
  }

  const status = flags.get('status')?.[0] ?? TENANT_STATUS.ACTIVE;
  if (!isTenantStatus(status)) {
    throw new Error(
      `seed-tenant: --status must be one of ${Object.values(TENANT_STATUS).join(', ')}.`,
    );
  }

  const primaryDomain = requireOne('primary-domain');
  if (!isValidDomain(primaryDomain)) {
    throw new Error(
      `seed-tenant: --primary-domain "${primaryDomain}" is not a valid domain.`,
    );
  }

  const extraDomains = flags.get('domain') ?? [];
  for (const domain of extraDomains) {
    if (!isValidDomain(domain)) {
      throw new Error(
        `seed-tenant: --domain "${domain}" is not a valid domain.`,
      );
    }
  }

  return {
    name: requireOne('name'),
    primaryDomain,
    sanityProjectId: requireOne('sanity-project-id'),
    sanityDataset: requireOne('sanity-dataset'),
    locale: requireOne('locale'),
    ownerEmail: requireOne('owner-email'),
    plan,
    status,
    extraDomains,
    sanityReadToken: flags.get('sanity-read-token')?.[0],
  };
}

// Exported for direct testing of the idempotency check without also
// exercising argv parsing or the domain/membership writes `main()` wraps it
// in.
export async function resolveOrCreateTenant(
  args: TParsedArgs,
): Promise<TTenant> {
  const existing = await getTenantByDomain(args.primaryDomain);
  if (existing) {
    console.warn(
      `Tenant "${existing.name}" already exists (${existing.id}) — reusing it.`,
    );
    return existing;
  }

  const created = await createTenant({
    name: args.name,
    primaryDomain: args.primaryDomain,
    sanityProjectId: args.sanityProjectId,
    sanityDataset: args.sanityDataset,
    locale: args.locale,
    plan: args.plan,
    status: args.status,
  });
  if (!created.ok) {
    throw new Error(`seed-tenant: createTenant failed (${created.error}).`);
  }
  console.warn(`Created tenant "${created.data.name}" (${created.data.id}).`);
  return created.data;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const db = getDb();

  const tenant = await resolveOrCreateTenant(args);

  if (args.sanityReadToken) {
    await setTenantSanityToken(tenant.id, args.sanityReadToken);
    console.warn(`Sanity read token set for tenant "${tenant.name}".`);
  }

  for (const domain of [args.primaryDomain, ...args.extraDomains]) {
    const domainResult = await addTenantDomain(tenant.id, domain);
    if (!domainResult.ok) {
      throw new Error(
        `seed-tenant: addTenantDomain failed for "${domain}" (${domainResult.error}).`,
      );
    }
    console.warn(`Domain "${domain}" -> tenant "${tenant.name}".`);
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.email, args.ownerEmail));
  if (!owner) {
    throw new Error(
      `seed-tenant: no "users" row for "${args.ownerEmail}" — have them sign in to the site once first, then re-run this script.`,
    );
  }

  await createMembership(owner.id, tenant.id, MEMBERSHIP_ROLE.OWNER);
  console.warn(`Granted OWNER on "${tenant.name}" to "${args.ownerEmail}".`);
}

// Only auto-run when this file is the CLI entrypoint (`tsx seed-tenant.ts`)
// — guards against `main()` firing as an import side effect when a test
// imports `resolveOrCreateTenant` from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
