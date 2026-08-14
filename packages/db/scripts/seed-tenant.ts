/**
 * Seeds the tenant registry (`tenants`, `tenant_domains`, `memberships`)
 * for one tenant and grants an existing user the `OWNER` role on it.
 *
 * MANUAL, HUMAN-RUN ONLY — never wired into CI or any deploy pipeline. Run
 * it by hand, once, against the target Neon branch:
 *
 *   set -a && source apps/web/.env.local && set +a
 *   pnpm --filter @blog/db db:seed-tenant -- \
 *     --slug=acme \
 *     --name="Acme" \
 *     --primary-domain=acme.example.com \
 *     --sanity-project-id=<project id> \
 *     --sanity-dataset=production \
 *     --locale=en \
 *     --owner-email=owner@example.com \
 *     [--plan=FREE|GROWTH] [--status=ACTIVE|SUSPENDED] \
 *     [--domain=extra.example.com ...] [--sanity-read-token=<token>]
 *
 * Idempotent: re-running with the same `--slug` reuses the existing tenant
 * row instead of failing, and every write below (domain, membership) is
 * itself a no-op-safe upsert. `--owner-email` must already have a `users`
 * row — this script does not create one; the owner signs in once first (via
 * the site's normal Auth.js flow) so a real, correctly-linked account exists
 * before it is granted a membership.
 *
 * `db:seed-tenant`'s `--conditions=react-server` node flag makes `getDb()`'s
 * `import 'server-only'` resolve to its no-op export outside Next.js's own
 * build (the condition Next.js itself sets), so this plain-Node script can
 * reuse the real query functions instead of duplicating their SQL.
 */
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { createMembership } from '@blog/db/queries/memberships';
import { addTenantDomain } from '@blog/db/queries/tenant-domains';
import {
  createTenant,
  getTenantBySlug,
  setTenantSanityToken,
} from '@blog/db/queries/tenants';
import { users } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

type TParsedArgs = {
  slug: string;
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

  return {
    slug: requireOne('slug'),
    name: requireOne('name'),
    primaryDomain: requireOne('primary-domain'),
    sanityProjectId: requireOne('sanity-project-id'),
    sanityDataset: requireOne('sanity-dataset'),
    locale: requireOne('locale'),
    ownerEmail: requireOne('owner-email'),
    plan,
    status,
    extraDomains: flags.get('domain') ?? [],
    sanityReadToken: flags.get('sanity-read-token')?.[0],
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const db = getDb();

  let tenant = await getTenantBySlug(args.slug);
  if (tenant) {
    console.warn(
      `Tenant "${args.slug}" already exists (${tenant.id}) — reusing it.`,
    );
  } else {
    tenant = await createTenant({
      slug: args.slug,
      name: args.name,
      primaryDomain: args.primaryDomain,
      sanityProjectId: args.sanityProjectId,
      sanityDataset: args.sanityDataset,
      locale: args.locale,
      plan: args.plan,
      status: args.status,
    });
    console.warn(`Created tenant "${args.slug}" (${tenant.id}).`);
  }

  if (args.sanityReadToken) {
    await setTenantSanityToken(tenant.id, args.sanityReadToken);
    console.warn(`Sanity read token set for tenant "${args.slug}".`);
  }

  for (const domain of [args.primaryDomain, ...args.extraDomains]) {
    await addTenantDomain(tenant.id, domain);
    console.warn(`Domain "${domain}" -> tenant "${args.slug}".`);
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
  console.warn(`Granted OWNER on "${args.slug}" to "${args.ownerEmail}".`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
