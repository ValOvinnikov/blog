import { LOCALE_ISO_CODES, SITE_TYPE } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TDeprovisioningStep,
  type TElevateTenantOwnerOutcome,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
  type TWorkerProvisioningStep,
} from '@blog/db/constants';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestampColumns } from './columns';
import { tenantBillingColumns } from './tenant-billing-columns';
import { tenantInactivityColumns } from './tenant-inactivity-columns';
import { tenantOwnerAccessColumns } from './tenant-owner-access-columns';
import { selfServeOwnerSlotIndex } from './tenant-self-serve-owner-index';

export const tenantPlanEnum = pgEnum('tenant_plan', TENANT_PLAN);

export const localeCodeEnum = pgEnum('locale_code', LOCALE_ISO_CODES);

export const tenantStatusEnum = pgEnum('tenant_status', TENANT_STATUS);

export const siteTypeEnum = pgEnum('site_type', SITE_TYPE);

export type TProvisioningStepState = {
  status: TTenantProvisioningStepStatus;
  error?: string;
  detail?: TElevateTenantOwnerOutcome;
  failingSince?: string;
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
    sanityManagementTokenEncrypted: text('sanity_management_token_encrypted'),
    sanityManagementRobotId: text('sanity_management_robot_id'),
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
    ...tenantOwnerAccessColumns,
    unsentReinviteFormerOwnerEmailEncrypted: text(
      'unsent_reinvite_former_owner_email_encrypted',
    ),
    ...tenantInactivityColumns,
    ...tenantBillingColumns,
    contentMigrationFailedAt: timestamp('content_migration_failed_at', {
      mode: 'date',
    }),
    firstPostPublishedAt: timestamp('first_post_published_at', {
      mode: 'date',
    }),
    ...timestampColumns,
  },
  (tenant) => [selfServeOwnerSlotIndex(tenant)],
);

export type TTenant = typeof tenants.$inferSelect;
