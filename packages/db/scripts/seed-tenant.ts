// Seeds one tenant's registry rows and grants an existing user OWNER on it; manual, human-run only.
// `db:seed-tenant` runs with `--conditions=react-server` so `getDb()`'s `server-only` import resolves outside Next.js.
import { pathToFileURL } from 'node:url';

import { TENANT_PLAN, type TTenantPlan } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_STATUS,
  type TTenantStatus,
} from '@blog/db/constants';
import { createMembership } from '@blog/db/queries/memberships';
import {
  addTenantDomain,
  getTenantByDomain,
} from '@blog/db/queries/tenant-domains';
import {
  createTenant,
  getTenantById,
  getTenantIdBySanityProjectId,
  setTenantSanityToken,
} from '@blog/db/queries/tenants';
import { findUserByEmail } from '@blog/db/queries/users';
import type { TTenant } from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { isNull } from '@blog/utils/primitives';

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

export async function resolveOrCreateTenant(
  args: TParsedArgs,
): Promise<TTenant> {
  const existing = await getTenantByDomain(args.primaryDomain);
  if (existing) {
    if (
      !isNull(existing.sanityProjectId) &&
      existing.sanityProjectId !== args.sanityProjectId
    ) {
      throw new Error(
        `seed-tenant: domain "${args.primaryDomain}" belongs to tenant "${existing.id}", which holds Sanity project "${existing.sanityProjectId}", not "${args.sanityProjectId}".`,
      );
    }
    console.warn(
      `Tenant "${existing.name}" already exists (${existing.id}) — reusing it.`,
    );
    return existing;
  }

  const existingId = await getTenantIdBySanityProjectId(args.sanityProjectId);
  if (existingId) {
    const existingBySanityProjectId = await getTenantById(existingId, {
      includeArchived: true,
    });
    if (!existingBySanityProjectId) {
      throw new Error(
        `seed-tenant: Sanity project id "${args.sanityProjectId}" resolved to tenant id "${existingId}", but that tenant no longer exists.`,
      );
    }
    if (!isNull(existingBySanityProjectId.deprovisionedAt)) {
      throw new Error(
        `seed-tenant: Sanity project id "${args.sanityProjectId}" is already held by archived tenant "${existingBySanityProjectId.id}".`,
      );
    }
    console.warn(
      `Tenant "${existingBySanityProjectId.name}" (${existingBySanityProjectId.id}) already holds Sanity project "${args.sanityProjectId}" but is missing its domain row — resuming.`,
    );
    return existingBySanityProjectId;
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

  const owner = await findUserByEmail(args.ownerEmail);
  if (!owner) {
    throw new Error(
      `seed-tenant: no "users" row for "${args.ownerEmail}" — have them sign in to the site once first, then re-run this script.`,
    );
  }

  await createMembership(owner.id, tenant.id, MEMBERSHIP_ROLE.OWNER);
  console.warn(`Granted OWNER on "${tenant.name}" to "${args.ownerEmail}".`);
}

// The test imports this module, so main() runs only as the CLI entrypoint.
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
