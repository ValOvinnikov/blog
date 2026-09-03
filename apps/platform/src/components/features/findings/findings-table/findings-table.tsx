import { SIZE } from '@blog/config';
import type { TFinding } from '@blog/db/schema/findings';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { findingSeverityTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { findingsTableVariants } from './findings-table-variants';

export type TFindingsTableProps = {
  findings: TFinding[];
  /** Names for every tenant a listed finding references, keyed by tenant id — resolved by the page, not this presentational component. */
  tenantNamesById: Record<string, string>;
};

/**
 * Every currently open finding across the platform, including ones with no
 * tenant reference. Purely presentational — the page calling `listOpenFindings()`
 * owns the data.
 */
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

  if (findings.length === 0) {
    return (
      <Card className={card()}>
        <Card.Body>
          <p className={empty()}>{t('empty')}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={card()}>
      <table className={table()}>
        <thead>
          <tr>
            <th className={head()} scope="col">
              {t('columnTenant')}
            </th>
            <th className={head()} scope="col">
              {t('columnSource')}
            </th>
            <th className={head()} scope="col">
              {t('columnKind')}
            </th>
            <th className={head()} scope="col">
              {t('columnSeverity')}
            </th>
            <th className={head()} scope="col">
              {t('columnLastSeen')}
            </th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr className={row()} key={finding.id}>
              <td className={cell()}>
                {finding.tenantId ? (
                  <LinkButton
                    href={adminRoutes.tenantOverview(finding.tenantId)}
                    variant="ghost"
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
          ))}
        </tbody>
      </table>
    </Card>
  );
};
