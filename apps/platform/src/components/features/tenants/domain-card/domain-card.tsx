import {
  DOMAIN_VERIFICATION_STATUS,
  SIZE,
  type TDomainVerificationStatus,
} from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

export type TDomainCardProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  dnsHref: string;
};

const CHECKED_STATUSES: TDomainVerificationStatus[] = [
  DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
  DOMAIN_VERIFICATION_STATUS.PENDING,
  DOMAIN_VERIFICATION_STATUS.VERIFIED,
];

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
        actions={
          <>
            <StatusBadge
              tone={domainVerificationTone(domainVerificationStatus)}
            >
              {t(`dnsStatus.${domainVerificationStatus}`)}
            </StatusBadge>
            <LinkButton
              href={dnsHref}
              variant="ghost"
              size={SIZE.SM}
              hasArrow={true}
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
          {CHECKED_STATUSES.includes(domainVerificationStatus) && (
            <DetailList.Row label={t('lastCheckedLabel')}>
              {t('lastCheckedJustNow')}
            </DetailList.Row>
          )}
        </DetailList>
      </Card.Body>
    </Card>
  );
};
