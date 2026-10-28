import { MainAddressControl } from '@platform/components/features/tenants/domain-page-content/components/main-address-control/main-address-control';
import { RemoveCustomDomainControl } from '@platform/components/features/tenants/domain-page-content/components/remove-custom-domain-control/remove-custom-domain-control';
import { VerifiedDomainGate } from '@platform/components/features/tenants/domain-page-content/components/verified-domain-gate/verified-domain-gate';
import { MAIN_ADDRESS_TARGET } from '@platform/constants/custom-domain';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';

export type TCustomDomainActionsProps = {
  tenantId: string;
  domain: string;
  projectDomain: Promise<TProjectDomain>;
  isMainAddress: boolean;
  canMakeMain: boolean;
};

export const CustomDomainActions = ({
  tenantId,
  domain,
  projectDomain,
  isMainAddress,
  canMakeMain,
}: TCustomDomainActionsProps) => {
  if (isMainAddress) {
    return (
      <MainAddressControl
        tenantId={tenantId}
        domain={domain}
        target={MAIN_ADDRESS_TARGET.SUBDOMAIN}
      />
    );
  }

  return (
    <>
      {canMakeMain && (
        <VerifiedDomainGate projectDomain={projectDomain}>
          <MainAddressControl
            tenantId={tenantId}
            domain={domain}
            target={MAIN_ADDRESS_TARGET.CUSTOM_DOMAIN}
          />
        </VerifiedDomainGate>
      )}
      <RemoveCustomDomainControl tenantId={tenantId} domain={domain} />
    </>
  );
};
