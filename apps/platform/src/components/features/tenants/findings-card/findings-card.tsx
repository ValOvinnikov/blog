import type { TFindingSummary } from '@blog/db/schema/findings';
import { Card } from '@platform/components/shared/card';
import { CardList } from '@platform/components/shared/card-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { findingSeverityTone } from '@platform/utils/status-tone/status-tone';
import { useLocale, useTranslations } from 'next-intl';

import { FindingDetails } from './components/finding-details/finding-details';

export type TFindingsCardProps = {
  tenantId: string;
  findings: TFindingSummary[];
};

export const FindingsCard = ({ tenantId, findings }: TFindingsCardProps) => {
  const t = useTranslations('findingsCard');
  const locale = useLocale();
  const tSeverity = useTranslations('findingSeverityLabel');
  const tSource = useTranslations('findingSourceLabel');
  const tKind = useTranslations('findingKindLabel');

  return (
    <Card>
      <Card.Header title={t('title')} />
      <Card.Body>
        <CardList
          items={findings}
          emptyMessage={t('empty')}
          renderRow={(finding) => (
            <CardList.Row key={finding.id} align="start">
              <CardList.Lead>
                <StatusBadge tone={findingSeverityTone(finding.severity)}>
                  {tSeverity(finding.severity)}
                </StatusBadge>
              </CardList.Lead>
              <CardList.Primary>{tKind(finding.kind)}</CardList.Primary>
              <CardList.Secondary>{tSource(finding.source)}</CardList.Secondary>
              {finding.hasDetails && (
                <CardList.Footer>
                  <FindingDetails tenantId={tenantId} findingId={finding.id} />
                </CardList.Footer>
              )}
              <CardList.Time date={finding.lastSeenAt}>
                {formatDate(finding.lastSeenAt, locale)}
              </CardList.Time>
            </CardList.Row>
          )}
        />
      </Card.Body>
    </Card>
  );
};
