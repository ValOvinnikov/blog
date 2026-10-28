'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
  type TMaybeUndefined,
} from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  MIGRATION_ENVIRONMENT,
  RELEASE_LOG,
  RELEASE_REFUSAL,
} from '@platform/constants/release';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { z } from 'zod';

import { dispatchTenantMigrationWorkflow } from './dispatch-tenant-migration-workflow';
import { listFailedMigrationTenants } from './list-failed-migration-tenants';

const startTenantMigrationsInputSchema = z.object({
  environment: z.enum([
    MIGRATION_ENVIRONMENT.DEVELOPMENT,
    MIGRATION_ENVIRONMENT.PRODUCTION,
  ]),
  tenantId: z.string().uuid().optional(),
});

export type TStartTenantMigrationsInput = z.input<
  typeof startTenantMigrationsInputSchema
>;

export type TStartTenantMigrationsResult = TActionResult<
  | typeof ACTION_OUTCOME.REFUSED
  | typeof ACTION_OUTCOME.UNAVAILABLE
  | typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TStartTenantMigrationsInput,
  never,
  | typeof RELEASE_REFUSAL.TENANT_REQUIRED
  | typeof RELEASE_REFUSAL.TENANT_MIGRATION_NOT_FAILED
>;

const productionRefusal = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TStartTenantMigrationsResult>> => {
  if (!tenantId) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.TENANT_REQUIRED,
    };
  }

  const failedTenants = await listFailedMigrationTenants();
  if (!failedTenants.ok) return toOutcome(ACTION_OUTCOME.UNAVAILABLE);
  if (!failedTenants.data.some(({ id }) => id === tenantId)) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.TENANT_MIGRATION_NOT_FAILED,
    };
  }

  return undefined;
};

/** The audit event attests the dispatch request, not the workflow's outcome. */
export const startTenantMigrationsAction = async (
  input: TStartTenantMigrationsInput,
): Promise<TStartTenantMigrationsResult> => {
  await requireSuperAdmin();

  const parsed = startTenantMigrationsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }
  const { environment, tenantId } = parsed.data;

  if (environment === MIGRATION_ENVIRONMENT.PRODUCTION) {
    const refusal = await productionRefusal(tenantId);
    if (refusal) return refusal;
  }

  const isDispatched = await dispatchTenantMigrationWorkflow({
    environment,
    tenantId,
  });
  if (!isDispatched) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  await recordAuditEvent({
    logEvent: RELEASE_LOG.TENANT_MIGRATIONS_AUDIT_FAILED,
    action: AUDIT_ACTION.TENANT_MIGRATIONS_STARTED,
    targetType: tenantId ? AUDIT_TARGET_TYPE.TENANT : AUDIT_TARGET_TYPE.RELEASE,
    targetId: tenantId ?? environment,
    details: { environment },
  });

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
