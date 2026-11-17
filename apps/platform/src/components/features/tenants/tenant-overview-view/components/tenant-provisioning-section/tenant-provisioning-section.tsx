'use client';

import { ProvisioningBanner } from '@platform/components/features/tenants/provisioning-banner';
import { TenantDetailsPanel } from '@platform/components/features/tenants/tenant-details-panel';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  computeTenantFieldLocks,
  type TTenantFieldLockFlags,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useProvisioningPoll } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantOwnerMembership } from '@shinefold/db/queries/memberships';
import { useId } from 'react';

export type TTenantProvisioningSectionProps = {
  tenant: TClientTenant;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
  lockFlags: TTenantFieldLockFlags;
  isStudioReinviteUnsent: boolean;
};

export const TenantProvisioningSection = ({
  tenant,
  owner,
  lockFlags,
  isStudioReinviteUnsent,
}: TTenantProvisioningSectionProps) => {
  const { id, archivedAt } = tenant;
  const archivedNoticeId = useId();
  const poll = useProvisioningPoll(tenant);
  const { provisioningSteps, provisioningStatus } = poll;

  return (
    <>
      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      <ProvisioningBanner tenantId={id} poll={poll} />

      <TenantDetailsPanel
        tenant={tenant}
        fieldLocks={computeTenantFieldLocks(
          provisioningSteps,
          provisioningStatus,
          owner,
          lockFlags,
        )}
        owner={owner}
        isStudioReinviteUnsent={isStudioReinviteUnsent}
        archivedNoticeId={archivedNoticeId}
      />
    </>
  );
};
