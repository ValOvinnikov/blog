import { SIZE } from '@blog/config';
import type { TFinding } from '@blog/db/schema/findings';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { findingSeverityTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

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
  const tSeverity = useTranslations('findingSeverityLabel');
  const tSource = useTranslations('findingSourceLabel');
  const tKind = useTranslations('findingKindLabel');
  const { card, table, head, row, cell, noTenant, empty } =
    findingsTableVariants();

  return (
    <DataTableShell
      items={findings}
      emptyMessage={t('empty')}
      classNames={{
        card: card(),
        table: table(),
        head: head(),
        empty: empty(),
      }}
      columns={[
        { key: 'tenant', label: t('columnTenant') },
        { key: 'source', label: t('columnSource') },
        { key: 'kind', label: t('columnKind') },
        { key: 'severity', label: t('columnSeverity') },
        { key: 'lastSeen', label: t('columnLastSeen') },
      ]}
      renderRow={(finding) => (
        <tr className={row()} key={finding.id}>
          <td className={cell()}>
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
          </td>
          <td className={cell()}>{tSource(finding.source)}</td>
          <td className={cell()}>{tKind(finding.kind)}</td>
          <td className={cell()}>
            <StatusBadge tone={findingSeverityTone(finding.severity)}>
              {tSeverity(finding.severity)}
            </StatusBadge>
          </td>
          <td className={cell()}>
            <time dateTime={finding.lastSeenAt.toISOString()}>
              {formatDate(finding.lastSeenAt)}
            </time>
          </td>
        </tr>
      )}
    />
  );
};
