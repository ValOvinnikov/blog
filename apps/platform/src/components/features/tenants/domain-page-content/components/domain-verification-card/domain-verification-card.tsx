import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@blog/config';
import { DnsRecordsTable } from '@platform/components/features/tenants/domain-page-content/components/dns-records-table/dns-records-table';
import { Card } from '@platform/components/shared/card';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import { use } from 'react';

const UNCHECKED_STATUSES: ReadonlySet<TDomainVerificationStatus> = new Set([
  DOMAIN_VERIFICATION_STATUS.ERROR,
  DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
]);

export type TDomainVerificationCardProps = {
  domain: string;
  projectDomain: Promise<TProjectDomain>;
};

export const DomainVerificationCard = ({
  domain,
  projectDomain,
}: TDomainVerificationCardProps) => {
  const t = useTranslations('tenantDomainPage');
  const { status, dnsRecords } = use(projectDomain);
  const isVerified = status === DOMAIN_VERIFICATION_STATUS.VERIFIED;
  const wasChecked = !UNCHECKED_STATUSES.has(status);

  return (
    <Card>
      <Card.Header
        title={t(isVerified ? 'verifiedCardTitle' : 'cardTitle', { domain })}
        actions={
          <>
            <StatusBadge tone={domainVerificationTone(status)}>
              {t(`dnsStatus.${status}`)}
            </StatusBadge>
            {wasChecked && (
              <Text variant="hint" as="span">
                {t('checkedHint')}
              </Text>
            )}
          </>
        }
      />
      <Card.Body>
        {isVerified ? (
          <Text variant="supporting">{t('verifiedEmptyState')}</Text>
        ) : dnsRecords.length > 0 ? (
          <>
            <Text variant="supporting">{t('bodyCopy')}</Text>
            <DnsRecordsTable records={dnsRecords} />
          </>
        ) : (
          <Text variant="supporting">{t('unavailableState')}</Text>
        )}
      </Card.Body>
    </Card>
  );
};
