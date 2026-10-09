import { DOMAIN_VERIFICATION_STATUS } from '@blog/config';
import { DnsRecordsTable } from '@platform/components/features/tenants/domain-page-content/components/dns-records-table/dns-records-table';
import { Card } from '@platform/components/shared/card';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';
import { use } from 'react';

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

  return (
    <Card>
      <Card.Header
        title={t('cardTitle', { domain })}
        actions={
          <>
            <StatusBadge tone={domainVerificationTone(status)}>
              {t(`dnsStatus.${status}`)}
            </StatusBadge>
            <Text variant="hint" as="span">
              {t('checkedHint')}
            </Text>
          </>
        }
      />
      <Card.Body>
        {status === DOMAIN_VERIFICATION_STATUS.VERIFIED ? (
          <Text variant="supporting">{t('verifiedEmptyState')}</Text>
        ) : (
          <>
            <Text variant="supporting">{t('bodyCopy')}</Text>
            {dnsRecords.length > 0 ? (
              <DnsRecordsTable records={dnsRecords} />
            ) : (
              <Text variant="supporting">{t('unavailableState')}</Text>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};
