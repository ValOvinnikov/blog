import 'server-only';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@blog/config';
import { queries } from '@blog/db';
import type { TENANT_DETAILS_UPDATE_OUTCOME } from '@blog/db/constants';
import type {
  TUpdateTenantDetailsInput,
  TUpdateTenantDetailsResult,
} from '@blog/db/queries/tenants/update-tenant-details/update-tenant-details';
import type { TTenant } from '@blog/db/schema/tenants';
import { isUndefined } from '@blog/utils/primitives';
import { TENANT_LOG } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { reinviteChangedOwner } from '@platform/server/tenants/reinvite-changed-owner';

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
): Promise<TTenantDetailsSaved> => {
  await revalidateSiteConfig(tenantId);
  const studioReinvite = await reinviteIfOwnerChanged(
    tenant,
    ownerEmail,
    previousOwnerEmail,
  );
  const studioReinviteRequested =
    !isUndefined(studioReinvite) && isOutcomeSuccess(studioReinvite);
  await recordAuditEvent({
    logEvent: TENANT_LOG.UPDATE_DETAILS_AUDIT_FAILED,
    action: AUDIT_ACTION.SETTINGS_UPDATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: {
      ...auditedDetails,
      ownerEmailUpdated: !isUndefined(previousOwnerEmail),
      studioReinviteRequested,
    },
  });

  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    tenant,
    isStudioReinviteUnsent:
      !isUndefined(studioReinvite) && !studioReinviteRequested,
  };
};
