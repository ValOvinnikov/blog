import { ConnectedDomainDetails } from '@platform/components/features/tenants/domain-page-content/components/connected-domain-details/connected-domain-details';
import { DnsRecordsTable } from '@platform/components/features/tenants/domain-page-content/components/dns-records-table/dns-records-table';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import { use, type ReactNode } from 'react';

import { domainVerificationCardVariants } from './domain-verification-card-variants';

const UNCHECKED_STATUSES: ReadonlySet<TDomainVerificationStatus> = new Set([
  DOMAIN_VERIFICATION_STATUS.ERROR,
  DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
]);

export type TDomainVerificationCardProps = {
  domain: string;
  isPlatformAddress: boolean;
  projectDomain: Promise<TProjectDomain>;
  title?: string;
  actions?: ReactNode;
};

export const DomainVerificationCard = ({
  domain,
  isPlatformAddress,
  projectDomain,
  title,
  actions,
}: TDomainVerificationCardProps) => {
  const t = useTranslations('tenantDomainPage');
  const { status, dnsRecords } = use(projectDomain);
  const isVerified = status === DOMAIN_VERIFICATION_STATUS.VERIFIED;
  const wasChecked = !UNCHECKED_STATUSES.has(status);
  const { pendingAddress } = domainVerificationCardVariants();

  return (
    <Card>
      <Card.Header
        title={title ?? t('cardTitle')}
        actions={
          (!isVerified || actions) && (
            <>
              {!isVerified && (
                <>
                  <StatusBadge tone={domainVerificationTone(status)}>
                    {t(`dnsStatus.${status}`)}
                  </StatusBadge>
                  {wasChecked && (
                    <Text variant="meta" as="span">
                      {t('checkedHint')}
                    </Text>
                  )}
                </>
              )}
              {actions}
            </>
          )
        }
      />
      <Card.Body>
        {isVerified ? (
          <ConnectedDomainDetails
            domain={domain}
            isPlatformAddress={isPlatformAddress}
          />
        ) : (
          <>
            <DetailList className={pendingAddress()}>
              <DetailList.Row label={t('addressLabel')} isMono={true}>
                {domain}
              </DetailList.Row>
            </DetailList>
            {dnsRecords.length > 0 ? (
              <>
                <Text variant="muted">{t('bodyCopy')}</Text>
                <DnsRecordsTable records={dnsRecords} />
              </>
            ) : (
              <Text variant="supporting">{t('unavailableState')}</Text>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};
