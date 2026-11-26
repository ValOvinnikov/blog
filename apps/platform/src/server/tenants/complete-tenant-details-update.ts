import 'server-only';

import {
  TENANT_LOG,
  TENANTS_LIST_PURGE_ARGS,
} from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { changedTenantDetailsFields } from '@platform/server/tenants/changed-tenant-details-fields';
import { onTenantPlanChange } from '@platform/server/tenants/on-tenant-plan-change';
import { reinviteChangedOwner } from '@platform/server/tenants/reinvite-changed-owner';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TENANT_DETAILS_UPDATE_OUTCOME } from '@shinefold/db/constants';
import type {
  TUpdateTenantDetailsInput,
  TUpdateTenantDetailsResult,
} from '@shinefold/db/queries/tenants/update-tenant-details/update-tenant-details';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isUndefined } from '@shinefold/utils/primitives';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

type TTenantDetailsUpdate = Extract<
  TUpdateTenantDetailsResult,
  { outcome: typeof TENANT_DETAILS_UPDATE_OUTCOME.UPDATED }
>;

export type TTenantDetailsSaved = {
  outcome: typeof ACTION_OUTCOME.SUCCESS;
  tenant: TTenant;
  isStudioReinviteUnsent: boolean;
};

const reinviteIfOwnerChanged = async (
  tenant: TTenant,
  ownerEmail: TMaybeUndefined<string>,
  previousOwnerEmail: TMaybeUndefined<string>,
): Promise<TMaybeUndefined<TOwnerAccessRequestResult>> => {
  if (isUndefined(ownerEmail) || isUndefined(previousOwnerEmail)) {
    return undefined;
  }
  const result = await reinviteChangedOwner(
    tenant,
    ownerEmail,
    previousOwnerEmail,
  );
  if (!isUndefined(result) && !isOutcomeSuccess(result)) {
    await queries.tenants.setUnsentStudioReinvite(
      tenant.id,
      previousOwnerEmail,
    );
  }
  return result;
};

export const completeTenantDetailsUpdate = async (
  tenantId: string,
  { ownerEmail, ...auditedDetails }: TUpdateTenantDetailsInput,
  { tenant, previousOwnerEmail }: TTenantDetailsUpdate,
  previousTenant: TTenant,
): Promise<TTenantDetailsSaved> => {
  await revalidateSiteConfig(tenantId);
  revalidatePath(...TENANTS_LIST_PURGE_ARGS);
  after(() => onTenantPlanChange(tenantId, previousTenant.plan, tenant.plan));
  const studioReinvite = await reinviteIfOwnerChanged(
    tenant,
    ownerEmail,
    previousOwnerEmail,
  );
  const studioReinviteRequested =
    !isUndefined(studioReinvite) && isOutcomeSuccess(studioReinvite);
  const isStudioReinviteUnsent =
    !isUndefined(studioReinvite) && !studioReinviteRequested;
  await recordAuditEvent({
    logEvent: TENANT_LOG.UPDATE_DETAILS_AUDIT_FAILED,
    action: AUDIT_ACTION.SETTINGS_UPDATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: {
      ...auditedDetails,
      changedFields: changedTenantDetailsFields(
        auditedDetails,
        previousTenant,
        previousOwnerEmail,
      ),
      ...(previousTenant.plan !== tenant.plan && {
        planChanged: { from: previousTenant.plan, to: tenant.plan },
      }),
      ownerEmailUpdated: !isUndefined(previousOwnerEmail),
      studioReinviteRequested,
      studioReinviteUnsent: isStudioReinviteUnsent,
    },
  });

  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    tenant,
    isStudioReinviteUnsent,
  };
};
