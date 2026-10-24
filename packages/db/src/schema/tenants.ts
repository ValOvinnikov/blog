import {
  LOCALE_ISO_CODES,
  SITE_TYPE,
  type TLocaleIsoCode,
  type TSanityLoginProvider,
  type TSiteType,
} from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TDeprovisioningStep,
  type TSuspensionReason,
  type TElevateTenantOwnerOutcome,
  type TSanityProjectRole,
  type TTenantPlan,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
  type TTenantStatus,
  type TWorkerProvisioningStep,
} from '@blog/db/constants';
import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN } from './columns';

export const tenantPlanEnum = pgEnum(
  'tenant_plan',
  Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]],
);

export const localeCodeEnum = pgEnum(
  'locale_code',
  Object.values(LOCALE_ISO_CODES) as [TLocaleIsoCode, ...TLocaleIsoCode[]],
);

export const tenantStatusEnum = pgEnum(
  'tenant_status',
  Object.values(TENANT_STATUS) as [TTenantStatus, ...TTenantStatus[]],
);

export const siteTypeEnum = pgEnum(
  'site_type',
  Object.values(SITE_TYPE) as [TSiteType, ...TSiteType[]],
);

export type TProvisioningStepState = {
  status: TTenantProvisioningStepStatus;
  error?: string;
  detail?: TElevateTenantOwnerOutcome;
  updatedAt?: string;
};

export type TProvisioningRun = {
  startedAt: string;
  finishedAt?: string;
  registry?: string;
  workflowRunUrl?: string;
  admittedAt?: string;
};

// `run` is lowercase so it can never collide with an UPPERCASE step key.
export type TTenantProvisioningState = Record<
  TTenantProvisioningStep,
  TProvisioningStepState
> &
  Partial<Record<TWorkerProvisioningStep, TProvisioningStepState>> & {
    run?: TProvisioningRun;
  };

export type TDeprovisioningStepState = {
  status: TTenantProvisioningStepStatus;
  error?: string;
  updatedAt?: string;
};

export type TDeprovisioningRun = {
  startedAt: string;
  finishedAt?: string;
  workflowRunUrl?: string;
};

export type TTenantDeprovisioningState = Record<
  TDeprovisioningStep,
  TDeprovisioningStepState
> & { run?: TDeprovisioningRun };

export const SELF_SERVE_FREE_OWNER_INDEX_NAME =
  'tenants_self_serve_free_owner_idx';

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    primaryDomain: text('primary_domain').notNull(),
    sanityProjectId: text('sanity_project_id').unique(),
    sanityDataset: text('sanity_dataset'),
    sanityReadTokenEncrypted: text('sanity_read_token_encrypted'),
    sanityWriteTokenEncrypted: text('sanity_write_token_encrypted'),
    revalidateWebhookSecretEncrypted: text(
      'revalidate_webhook_secret_encrypted',
    ),
    locale: localeCodeEnum('locale').notNull(),
    additionalLocales: localeCodeEnum('additional_locales')
      .array()
      .notNull()
      .default([]),
    plan: tenantPlanEnum('plan').notNull(),
    status: tenantStatusEnum('status').notNull(),
    provisioningStatus: text(
      'provisioning_status',
    ).$type<TTenantProvisioningStatus>(),
    provisioningSteps:
      jsonb('provisioning_steps').$type<TTenantProvisioningState>(),
    lastNotifiedOwnerElevationOutcome: text(
      'last_notified_owner_elevation_outcome',
    ).$type<TElevateTenantOwnerOutcome>(),
    seededAt: timestamp('seeded_at', { mode: 'date' }),
    webhookCreatedAt: timestamp('webhook_created_at', { mode: 'date' }),
    deprovisionedAt: timestamp('deprovisioned_at', { mode: 'date' }),
    deprovisioningSteps: jsonb(
      'deprovisioning_steps',
    ).$type<TTenantDeprovisioningState>(),
    siteType: siteTypeEnum('site_type'),
    siteTemplateVersion: integer('site_template_version'),
    selfServeOwnerEmailIndex: text('self_serve_owner_email_index'),
    ownerSanityInviteId: text('owner_sanity_invite_id'),
    ownerInviteSentAt: timestamp('owner_invite_sent_at', { mode: 'date' }),
    ownerInviteAcceptedAt: timestamp('owner_invite_accepted_at', {
      mode: 'date',
    }),
    ownerSanityUserId: text('owner_sanity_user_id'),
    ownerLoginProvider: text(
      'owner_login_provider',
    ).$type<TSanityLoginProvider>(),
    ownerSanityRole: text('owner_sanity_role').$type<TSanityProjectRole>(),
    ownerInviteHeadsUpSentAt: timestamp('owner_invite_heads_up_sent_at'),
    ownerInviteNudgeSentAt: timestamp('owner_invite_nudge_sent_at'),
    ownerSiteReadySentAt: timestamp('owner_site_ready_sent_at'),
    lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
    inactivityWarnedAt: timestamp('inactivity_warned_at'),
    suspendedAt: timestamp('suspended_at'),
    deletionNotifiedAt: timestamp('deletion_notified_at'),
    suspensionReason: text('suspension_reason').$type<TSuspensionReason>(),
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (tenant) => [
    uniqueIndex(SELF_SERVE_FREE_OWNER_INDEX_NAME)
      .on(tenant.selfServeOwnerEmailIndex)
      .where(
        sql`${tenant.plan} = ${sql.raw(`'${TENANT_PLAN.FREE}'`)} and ${tenant.status} <> ${sql.raw(`'${TENANT_STATUS.ARCHIVED}'`)}`,
      ),
  ],
);

export type TTenant = typeof tenants.$inferSelect;
