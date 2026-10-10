import { SIZE } from '@blog/config';
import type { TFinding } from '@blog/db/schema/findings';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { findingSeverityTone } from '@platform/utils/status-tone/status-tone';
import { useLocale, useTranslations } from 'next-intl';

import { findingsTableVariants } from './findings-table-variants';

export type TFindingsTableProps = {
  findings: TFinding[];
  tenantNamesById: Record<string, string>;
};

export const FindingsTable = ({
  findings,
  tenantNamesById,
}: TFindingsTableProps) => {
  const t = useTranslations('findingsTable');
  const tView = useTranslations('findingsView');
  const locale = useLocale();
  const tSeverity = useTranslations('findingSeverityLabel');
  const tSource = useTranslations('findingSourceLabel');
  const tKind = useTranslations('findingKindLabel');
  const { noTenant } = findingsTableVariants();

  return (
    <DataTableShell
      items={findings}
      emptyMessage={t('empty')}
      ariaLabel={tView('title')}
      columns={[
        { key: 'tenant', label: t('columnTenant') },
        { key: 'source', label: t('columnSource') },
        { key: 'kind', label: t('columnKind') },
        { key: 'severity', label: t('columnSeverity') },
        { key: 'lastSeen', label: t('columnLastSeen') },
      ]}
      renderRow={(finding) => (
        <DataTableShell.Row key={finding.id}>
          <DataTableShell.Cell>
            {finding.tenantId ? (
              <LinkButton
                href={adminRoutes.tenantOverview(finding.tenantId)}
                variant="secondary"
                size={SIZE.SM}
              >
                {tenantNamesById[finding.tenantId] ?? finding.tenantId}
              </LinkButton>
            ) : (
              <span className={noTenant()}>{t('noTenant')}</span>
            )}
          </DataTableShell.Cell>
          <DataTableShell.Cell>{tSource(finding.source)}</DataTableShell.Cell>
          <DataTableShell.Cell>{tKind(finding.kind)}</DataTableShell.Cell>
          <DataTableShell.Cell>
            <StatusBadge tone={findingSeverityTone(finding.severity)}>
              {tSeverity(finding.severity)}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <time dateTime={finding.lastSeenAt.toISOString()}>
              {formatDate(finding.lastSeenAt, locale)}
            </time>
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    />
  );
};
