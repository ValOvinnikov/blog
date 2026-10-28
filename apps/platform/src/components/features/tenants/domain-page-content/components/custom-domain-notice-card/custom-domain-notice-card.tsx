'use client';

import { useCustomDomainFocus } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

export type TCustomDomainNoticeCardProps = {
  noticeKey: 'archivedState' | 'ownerOnly' | 'upgradePrompt';
};

export const CustomDomainNoticeCard = ({
  noticeKey,
}: TCustomDomainNoticeCardProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { registerHeading } = useCustomDomainFocus();

  return (
    <Card>
      <Card.Header
        title={t('title')}
        supportingText={t('supportingText')}
        titleRef={registerHeading}
        titleTabIndex={-1}
      />
      <Card.Body>
        <Text>{t(noticeKey)}</Text>
      </Card.Body>
    </Card>
  );
};
