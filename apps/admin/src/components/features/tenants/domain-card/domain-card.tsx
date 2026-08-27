import { Card } from '@admin/components/shared/card';
import { DetailList } from '@admin/components/shared/detail-list';
import { LinkButton } from '@admin/components/shared/link-button';
import { StatusBadge } from '@admin/components/shared/status-badge';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { adminRoutes } from '@admin/utils/routes/routes';
import { domainVerificationTone } from '@admin/utils/status-tone/status-tone';
import { Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

export type TDomainCardProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
};

export const DomainCard = ({
  tenant,
  domainVerificationStatus,
}: TDomainCardProps) => {
  const t = useTranslations('tenantOverviewPage');

  return (
    <Card>
      <Card.Header
        title={t('domainCardTitle')}
        headingLevel={2}
        actions={
          <>
            <StatusBadge
              tone={domainVerificationTone(domainVerificationStatus)}
            >
              {t(`dnsStatus.${domainVerificationStatus}`)}
            </StatusBadge>
            <LinkButton
              href={adminRoutes.tenantDomain(tenant.id)}
              variant="ghost"
              size={Size.SM}
            >
              {t('dnsLinkButton')}
            </LinkButton>
          </>
        }
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('publicDomainLabel')} isMono={true}>
            {tenant.primaryDomain}
          </DetailList.Row>
          <DetailList.Row label={t('lastCheckedLabel')}>
            {t('lastCheckedJustNow')}
          </DetailList.Row>
        </DetailList>
      </Card.Body>
    </Card>
  );
};
