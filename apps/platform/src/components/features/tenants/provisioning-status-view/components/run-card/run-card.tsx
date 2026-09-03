import { SIZE } from '@blog/config';
import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useTranslations } from 'next-intl';

import { runCardVariants } from './run-card-variants';

type TRunCardProps = {
  run: TProvisioningRun;
};

/** The provisioning page's own record of the dispatched workflow run — when it started, when (or whether) it finished, and where to inspect it, independent of the per-step statuses in the Steps card. */
export const RunCard = ({ run }: TRunCardProps) => {
  const t = useTranslations('provisioningStatusView');
  const { workflowLogLink } = runCardVariants();

  return (
    <Card>
      <Card.Header title={t('runCardTitle')} headingLevel={2} />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('runStartedLabel')}>
            {run.startedAt ? (
              <time dateTime={run.startedAt}>
                {formatRelativeTime(new Date(run.startedAt), t)} ·{' '}
                {formatDateTime(run.startedAt)}
              </time>
            ) : (
              t('runStartedPending')
            )}
          </DetailList.Row>
          <DetailList.Row label={t('runFinishedLabel')}>
            {run.finishedAt ? (
              <time dateTime={run.finishedAt}>
                {formatRelativeTime(new Date(run.finishedAt), t)} ·{' '}
                {formatDateTime(run.finishedAt) ?? t('runFinishedPending')}
              </time>
            ) : (
              t('runFinishedPending')
            )}
          </DetailList.Row>
          {run.registry && (
            <DetailList.Row label={t('runRegistryLabel')}>
              <StatusBadge tone="neutral" hasDot={false}>
                {run.registry}
              </StatusBadge>
            </DetailList.Row>
          )}
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
