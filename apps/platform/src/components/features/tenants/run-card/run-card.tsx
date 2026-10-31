import { SIZE } from '@blog/config';
import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { runCardVariants } from './run-card-variants';

type TRunCardRun = Partial<
  Pick<
    TProvisioningRun,
    'startedAt' | 'finishedAt' | 'registry' | 'workflowRunUrl'
  >
>;

type TRunCardProps = {
  run?: TRunCardRun;
  actions?: ReactNode;
  headingLevel?: Exclude<THeadingLevel, 1>;
};

export const RunCard = ({ run, actions, headingLevel }: TRunCardProps) => {
  const t = useTranslations('runStatus');
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
        {run ? (
          <>
            <DetailList>
              <DetailList.Row label={t('runStartedLabel')}>
                {run.startedAt ? (
                  <time dateTime={run.startedAt}>
                    {formatRelativeTime(new Date(run.startedAt), t, locale)} ·{' '}
                    {formatDateTime(run.startedAt, locale)}
                  </time>
                ) : (
                  t('runStartedPending')
                )}
              </DetailList.Row>
              <DetailList.Row label={t('runFinishedLabel')}>
                {run.finishedAt ? (
                  <time dateTime={run.finishedAt}>
                    {formatRelativeTime(new Date(run.finishedAt), t, locale)} ·{' '}
                    {formatDateTime(run.finishedAt, locale) ??
                      t('runFinishedPending')}
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
                variant={BUTTON_VARIANT.GHOST}
                size={SIZE.SM}
                className={workflowLogLink()}
              >
                {t('runWorkflowLogLink')}
              </ExternalLinkButton>
            )}
          </>
        ) : (
          <Text variant="supporting">{t('runCardEmpty')}</Text>
        )}
      </Card.Body>
    </Card>
  );
};
