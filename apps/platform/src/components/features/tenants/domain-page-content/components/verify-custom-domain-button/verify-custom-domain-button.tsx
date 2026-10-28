'use client';

import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';

import { useVerifyCustomDomain } from './use-verify-custom-domain';

export type TVerifyCustomDomainButtonProps = {
  tenantId: string;
};

export const VerifyCustomDomainButton = ({
  tenantId,
}: TVerifyCustomDomainButtonProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { isPending, verify } = useVerifyCustomDomain(tenantId);

  return (
    <Button
      variant="primary"
      isPending={isPending}
      pendingLabel={t('verifying')}
      onClick={verify}
    >
      {t('verify')}
    </Button>
  );
};
