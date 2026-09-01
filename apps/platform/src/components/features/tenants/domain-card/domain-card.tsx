import { SIZE } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

export type TDomainCardProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  /** Where the "DNS →" link goes — `/tenants/{id}/domain` on the platform tree, `/dashboard/domain` on the owner tree. */
  dnsHref: string;
};

export const DomainCard = ({
  tenant,
  domainVerificationStatus,
  dnsHref,
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
            <LinkButton href={dnsHref} variant="ghost" size={SIZE.SM}>
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
