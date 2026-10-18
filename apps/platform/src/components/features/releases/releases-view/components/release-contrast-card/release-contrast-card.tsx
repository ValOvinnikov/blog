'use client';

import { SIZE } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import {
  CONTRAST_STATUS,
  type TContrastStatus,
} from '@platform/constants/release';
import { adminRoutes } from '@platform/utils/routes/routes';
import { contrastStatusTone } from '@platform/utils/status-tone/status-tone';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { RunContrastCheckButton } from '../run-contrast-check-button/run-contrast-check-button';

const releaseContrastCardVariants = tv({
  slots: {
    body: ['flex flex-col items-start gap-2'],
  },
});

export type TReleaseContrastCardProps = {
  status: TContrastStatus;
};

const SERVER_AUTHORITATIVE_STATUSES: TContrastStatus[] = [
  CONTRAST_STATUS.RUNNING,
  CONTRAST_STATUS.GREEN,
  CONTRAST_STATUS.FAILED,
];

export const ReleaseContrastCard = ({
  status: serverStatus,
}: TReleaseContrastCardProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const status =
    hasStarted && !SERVER_AUTHORITATIVE_STATUSES.includes(serverStatus)
      ? CONTRAST_STATUS.RUNNING
      : serverStatus;
  const t = useTranslations('releaseContrastCard');
  const { body } = releaseContrastCardVariants();

  return (
    <Card>
      <Card.Header
        title={t('title')}
        supportingText={t('description')}
        actions={
          <RunContrastCheckButton
            isRunning={status === CONTRAST_STATUS.RUNNING}
            onStarted={() => setHasStarted(true)}
          />
        }
      />
      <Card.Body>
        <div className={body()}>
          <StatusBadge tone={contrastStatusTone(status)}>
            {t(`status.${status}`)}
          </StatusBadge>
          <Text variant="muted">{t(`explanation.${status}`)}</Text>
          {status === CONTRAST_STATUS.FAILED && (
            <LinkButton
              href={adminRoutes.findings()}
              variant="secondary"
              size={SIZE.SM}
            >
              {t('viewFinding')}
            </LinkButton>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
