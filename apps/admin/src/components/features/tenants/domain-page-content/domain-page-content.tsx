import { Card } from '@admin/components/shared/card';
import { PageHeader } from '@admin/components/shared/page-header';
import { StatusBadge } from '@admin/components/shared/status-badge';
import { Text } from '@admin/components/shared/text';
import type { TDomainDnsRecord } from '@admin/server/provisioning/get-domain-dns-records';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { domainVerificationTone } from '@admin/utils/status-tone/status-tone';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { DnsRecordsTable } from './components/dns-records-table/dns-records-table';
import { domainPageContentVariants } from './domain-page-content-variants';

export type TDomainPageContentProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  dnsRecords: TDomainDnsRecord[] | undefined;
};

export const DomainPageContent = ({
  tenant,
  domainVerificationStatus,
  dnsRecords,
}: TDomainPageContentProps) => {
  const t = useTranslations('tenantDomainPage');
  const { root } = domainPageContentVariants();
  const isVerified = domainVerificationStatus === 'VERIFIED';

  return (
    <div className={root()}>
      <PageHeader
        title={tenant.primaryDomain}
        description={t('subCopy')}
        badges={
          <StatusBadge tone={domainVerificationTone(domainVerificationStatus)}>
            {t(`dnsStatus.${domainVerificationStatus}`)}
          </StatusBadge>
        }
      />

      <Card>
        <Card.Header
          title={t('cardTitle', { domain: tenant.primaryDomain })}
          supportingText={t('checkedHint')}
        />
        <Card.Body>
          {isVerified ? (
            <Text variant="muted">{t('verifiedEmptyState')}</Text>
          ) : (
            <>
              <Text variant="supporting">{t('bodyCopy')}</Text>
              {dnsRecords && dnsRecords.length > 0 ? (
                <DnsRecordsTable records={dnsRecords} />
              ) : (
                <Text variant="muted">{t('unavailableState')}</Text>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};
