import { SIZE } from '@blog/config';
import type { TDeprovisioningRun } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { runCardVariants } from './run-card-variants';

type TRunCardProps = {
  run: TDeprovisioningRun;
  actions?: ReactNode;
};

export const RunCard = ({ run, actions }: TRunCardProps) => {
  const t = useTranslations('deprovisioningStatusView');
  const { workflowLogLink } = runCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('runCardTitle')}
        headingLevel={2}
        actions={actions}
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('runStartedLabel')}>
            <time dateTime={run.startedAt}>
              {formatRelativeTime(new Date(run.startedAt), t)} ·{' '}
              {formatDateTime(run.startedAt)}
            </time>
          </DetailList.Row>
          <DetailList.Row label={t('runFinishedLabel')}>
            {run.finishedAt ? (
              <time dateTime={run.finishedAt}>
                {formatRelativeTime(new Date(run.finishedAt), t)} ·{' '}
                {formatDateTime(run.finishedAt)}
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
