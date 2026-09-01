import type { TTenant } from '@blog/db/schema/tenants';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Card } from '@platform/components/shared/card';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TDomainDnsRecord } from '@platform/server/provisioning/get-domain-dns-records';
import type { TDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { domainVerificationTone } from '@platform/utils/status-tone/status-tone';
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
        title={t('pageTitle')}
        description={t('subCopy')}
        badges={
          <StatusBadge tone={domainVerificationTone(domainVerificationStatus)}>
            {t(`dnsStatus.${domainVerificationStatus}`)}
          </StatusBadge>
        }
      />

      {tenant.deprovisionedAt && (
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      )}

      <Card>
        <Card.Header
          title={t('cardTitle', { domain: tenant.primaryDomain })}
          headingLevel={2}
          actions={
            <Text variant="hint" as="span">
              {t('checkedHint')}
            </Text>
          }
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
