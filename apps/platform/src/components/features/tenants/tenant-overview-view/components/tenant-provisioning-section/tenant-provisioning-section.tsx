'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import { ProvisioningBanner } from '@platform/components/features/tenants/provisioning-banner';
import { TenantDetailsPanel } from '@platform/components/features/tenants/tenant-details-panel';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { computeTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useProvisioningPoll } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { useId } from 'react';

export type TTenantProvisioningSectionProps = {
  tenant: TClientTenant;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
};

export const TenantProvisioningSection = ({
  tenant,
  owner,
}: TTenantProvisioningSectionProps) => {
  const { id, deprovisionedAt } = tenant;
  const archivedNoticeId = useId();
  const poll = useProvisioningPoll(tenant);
  const { provisioningSteps, provisioningStatus } = poll;

  return (
    <>
      {deprovisionedAt && (
        <ArchivedTenantNotice
          id={archivedNoticeId}
          archivedAt={deprovisionedAt}
        />
      )}

      <ProvisioningBanner tenantId={id} poll={poll} />

      <TenantDetailsPanel
        tenant={tenant}
        fieldLocks={computeTenantFieldLocks(
          provisioningSteps,
          provisioningStatus,
        )}
        owner={owner}
        archivedNoticeId={archivedNoticeId}
      />
    </>
  );
};
