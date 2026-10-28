'use client';

import { ALERT_TYPE } from '@blog/config';
import { useVerifyCustomDomain } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-claim-actions/use-verify-custom-domain';
import { RemoveCustomDomainControl } from '@platform/components/features/tenants/domain-page-content/components/remove-custom-domain-control/remove-custom-domain-control';
import { VerifyCustomDomainButton } from '@platform/components/features/tenants/domain-page-content/components/verify-custom-domain-button/verify-custom-domain-button';
import { Alert } from '@platform/components/shared/alert';
import { CUSTOM_DOMAIN_REFUSAL_KEYS } from '@platform/utils/custom-domain-keys/custom-domain-keys';
import { useTranslations } from 'next-intl';

import { customDomainClaimActionsVariants } from './custom-domain-claim-actions-variants';

export type TCustomDomainClaimActionsProps = {
  tenantId: string;
  domain: string;
};

export const CustomDomainClaimActions = ({
  tenantId,
  domain,
}: TCustomDomainClaimActionsProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { isPending, verify, rejection } = useVerifyCustomDomain(tenantId);
  const { root, buttons } = customDomainClaimActionsVariants();

  return (
    <div className={root()}>
      {rejection && (
        <Alert
          type={ALERT_TYPE.ERROR}
          description={t(`refusal.${CUSTOM_DOMAIN_REFUSAL_KEYS[rejection]}`)}
        />
      )}
      <div className={buttons()}>
        <RemoveCustomDomainControl
          tenantId={tenantId}
          domain={domain}
          isClaim={true}
        />
        <VerifyCustomDomainButton isPending={isPending} onVerify={verify} />
      </div>
    </div>
  );
};
