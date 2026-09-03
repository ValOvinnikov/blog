import type { TFinding } from '@blog/db/schema/findings';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { findingSeverityTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { findingsCardVariants } from './findings-card-variants';

export type TFindingsCardProps = {
  findings: TFinding[];
};

/**
 * This tenant's own open findings — the surface an operator already checks
 * while investigating a specific tenant, distinct from the platform-wide
 * Findings list.
 */
export const FindingsCard = ({ findings }: TFindingsCardProps) => {
  const t = useTranslations('findingsCard');
  const tSeverity = useTranslations('findingSeverityLabel');
  const tSource = useTranslations('findingSourceLabel');
  const tKind = useTranslations('findingKindLabel');
  const { list, row, body, kindText, sourceText, detailsPre, time, empty } =
    findingsCardVariants();

  return (
    <Card>
      <Card.Header title={t('title')} headingLevel={2} />
      <Card.Body>
        {findings.length === 0 ? (
          <p className={empty()}>{t('empty')}</p>
        ) : (
          <div className={list()}>
            {findings.map((finding) => (
              <div className={row()} key={finding.id}>
                <StatusBadge tone={findingSeverityTone(finding.severity)}>
                  {tSeverity(finding.severity)}
                </StatusBadge>
                <div className={body()}>
                  <span className={kindText()}>{tKind(finding.kind)}</span>
                  <span className={sourceText()}>
                    {tSource(finding.source)}
                  </span>
                  {finding.details && (
                    <Disclosure summary={t('detailsToggle')}>
                      <pre className={detailsPre()}>
                        {JSON.stringify(finding.details, null, 2)}
                      </pre>
                    </Disclosure>
                  )}
                </div>
                <time
                  dateTime={finding.lastSeenAt.toISOString()}
                  className={time()}
                >
                  {formatDate(finding.lastSeenAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
