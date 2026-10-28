'use client';

import { useCustomDomainFocus } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus';
import { RemoveCustomDomainControl } from '@platform/components/features/tenants/domain-page-content/components/remove-custom-domain-control/remove-custom-domain-control';
import { VerifyCustomDomainButton } from '@platform/components/features/tenants/domain-page-content/components/verify-custom-domain-button/verify-custom-domain-button';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { CUSTOM_DOMAIN_TXT_TYPE } from '@platform/constants/custom-domain';
import { customDomainTxtName } from '@platform/utils/custom-domain-txt-name/custom-domain-txt-name';
import { useTranslations } from 'next-intl';

import { customDomainClaimCardVariants } from './custom-domain-claim-card-variants';

export type TCustomDomainClaimCardProps = {
  tenantId: string;
  domain: string;
  token: string;
  canManage: boolean;
};

export const CustomDomainClaimCard = ({
  tenantId,
  domain,
  token,
  canManage,
}: TCustomDomainClaimCardProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const { registerHeading } = useCustomDomainFocus();
  const { records, selectable, footerActions } =
    customDomainClaimCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('title')}
        supportingText={t('supportingText')}
        titleRef={registerHeading}
        titleTabIndex={-1}
        actions={<StatusBadge tone="warn">{t('awaitingProof')}</StatusBadge>}
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('domainLabel')} isMono={true}>
            {domain}
          </DetailList.Row>
        </DetailList>
        <Text variant="muted">{t('proofInstructions')}</Text>
        <DetailList className={records()}>
          <DetailList.Row label={t('recordTypeLabel')} isMono={true}>
            {CUSTOM_DOMAIN_TXT_TYPE}
          </DetailList.Row>
          <DetailList.Row label={t('recordNameLabel')} isMono={true}>
            <span className={selectable()}>{customDomainTxtName(domain)}</span>
          </DetailList.Row>
          <DetailList.Row label={t('recordValueLabel')} isMono={true}>
            <span className={selectable()}>{token}</span>
          </DetailList.Row>
        </DetailList>
      </Card.Body>
      {canManage && (
        <Card.Footer>
          <div className={footerActions()}>
            <RemoveCustomDomainControl
              tenantId={tenantId}
              domain={domain}
              isClaim={true}
            />
            <VerifyCustomDomainButton tenantId={tenantId} />
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};
