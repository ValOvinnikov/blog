import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TElevateTenantOwnerOutcome,
  type TTenantPlan,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
  type TTenantStatus,
} from '@blog/db/constants';
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const tenantPlanEnum = pgEnum(
  'tenant_plan',
  Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]],
);

export const tenantStatusEnum = pgEnum(
  'tenant_status',
  Object.values(TENANT_STATUS) as [TTenantStatus, ...TTenantStatus[]],
);

export type TProvisioningStepState = {
  status: TTenantProvisioningStepStatus;
  error?: string;
  // Currently only ever set on the `OWNER_ELEVATION` step, carrying
  // `elevateTenantOwner`'s outcome. Typed as the outcome union (not `string`)
  // so an exhaustive downstream switch/map over it stays checked by `tsc`.
  detail?: TElevateTenantOwnerOutcome;
};

export type TTenantProvisioningSteps = Record<
  TTenantProvisioningStep,
  TProvisioningStepState
>;

// `primaryDomain` is the canonical domain; `tenant_domains` holds every
// domain (including this one) a tenant answers to.
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  primaryDomain: text('primary_domain').notNull(),
  // Nullable: null until provisioning step 1 (Create Sanity project) creates
  // the project and fills these in — a draft tenant genuinely has neither
  // yet, not a value standing in for one.
  sanityProjectId: text('sanity_project_id'),
  sanityDataset: text('sanity_dataset'),
  // Sanity read token for this tenant's project, AES-256-GCM encrypted
  // (`@blog/utils`'s encryptSecret) with TENANT_TOKEN_ENCRYPTION_KEY.
  // Nullable: a tenant provisioned before this column existed, or one still
  // being set up, has no token yet — @blog/service's client factory falls
  // back to the legacy single-tenant client until it's set.
  sanityReadTokenEncrypted: text('sanity_read_token_encrypted'),
  // Sanity write token for this tenant's project, same encryption envelope
  // as `sanityReadTokenEncrypted` above. Higher-privilege than the read
  // token — minted `editor`-scoped during provisioning's seed step and kept
  // (rather than revoked) so later writes can target this tenant's own
  // project instead of the platform's.
  sanityWriteTokenEncrypted: text('sanity_write_token_encrypted'),
  locale: text('locale').notNull(),
  plan: tenantPlanEnum('plan').notNull(),
  status: tenantStatusEnum('status').notNull(),
  // Plain `text`, not a pgEnum, mirroring `TENANT_PROVISIONING_STATUS`'s own
  // shape one level up. Nullable: a tenant created before provisioning
  // tracking existed (or not yet provisioning at all) has none.
  provisioningStatus: text(
    'provisioning_status',
  ).$type<TTenantProvisioningStatus>(),
  // Map of every `TENANT_PROVISIONING_STEP` key to its own progress — see
  // `TTenantProvisioningSteps` above.
  provisioningSteps:
    jsonb('provisioning_steps').$type<TTenantProvisioningSteps>(),
  studioVercelProjectId: text('studio_vercel_project_id'),
  seededAt: timestamp('seeded_at', { mode: 'date' }),
  // Set once provisioning creates the Sanity webhook pointing at apps/web's
  // shared revalidation endpoint. Nullable: unset until that step runs.
  webhookCreatedAt: timestamp('webhook_created_at', { mode: 'date' }),
  // Set once `scripts/deprovision-tenant` finishes tearing a tenant's infra
  // down (alongside `status` moving to ARCHIVED). The row is archived, never
  // hard-deleted, so `slug`'s unique constraint keeps a deprovisioned
  // tenant's slug from being silently re-registered.
  deprovisionedAt: timestamp('deprovisioned_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TTenant = typeof tenants.$inferSelect;
