import { SIZE } from '@blog/config';
import type { TDeprovisioningRun } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { runCardVariants } from './run-card-variants';

type TRunCardProps = {
  run: TDeprovisioningRun;
  actions?: ReactNode;
  headingLevel?: THeadingLevel;
};

export const RunCard = ({ run, actions, headingLevel }: TRunCardProps) => {
  const t = useTranslations('deprovisioningStatusView');
  const locale = useLocale();
  const { workflowLogLink } = runCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('runCardTitle')}
        headingLevel={headingLevel}
        actions={actions}
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('runStartedLabel')}>
            <time dateTime={run.startedAt}>
              {formatRelativeTime(new Date(run.startedAt), t, locale)} ·{' '}
              {formatDateTime(run.startedAt, locale)}
            </time>
          </DetailList.Row>
          <DetailList.Row label={t('runFinishedLabel')}>
            {run.finishedAt ? (
              <time dateTime={run.finishedAt}>
                {formatRelativeTime(new Date(run.finishedAt), t, locale)} ·{' '}
                {formatDateTime(run.finishedAt, locale)}
              </time>
            ) : (
              t('runFinishedPending')
            )}
          </DetailList.Row>
        </DetailList>
        {run.workflowRunUrl && (
          <ExternalLinkButton
            href={run.workflowRunUrl}
            variant="ghost"
            size={SIZE.SM}
            hasArrow={true}
            className={workflowLogLink()}
          >
            {t('runWorkflowLogLink')}
          </ExternalLinkButton>
        )}
      </Card.Body>
    </Card>
  );
};
