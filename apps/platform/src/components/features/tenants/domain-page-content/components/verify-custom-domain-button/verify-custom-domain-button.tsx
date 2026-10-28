'use client';

import { Button } from '@platform/components/shared/button';
import { useTranslations } from 'next-intl';

export type TVerifyCustomDomainButtonProps = {
  isPending: boolean;
  onVerify: () => void;
};

export const VerifyCustomDomainButton = ({
  isPending,
  onVerify,
}: TVerifyCustomDomainButtonProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');

  return (
    <Button
      variant="primary"
      isPending={isPending}
      pendingLabel={t('verifying')}
      onClick={onVerify}
    >
      {t('verify')}
    </Button>
  );
};
