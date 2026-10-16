import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const ELAPSED_TICK_MS = 1000;

const formatElapsed = (fromIso: string, now: number) => {
  const totalSeconds = Math.max(
    0,
    Math.floor((now - new Date(fromIso).getTime()) / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
};

type TQueuedRunNoticeProps = {
  admittedAt: TMaybeUndefined<string>;
};

export const QueuedRunNotice = ({ admittedAt }: TQueuedRunNoticeProps) => {
  const t = useTranslations('provisioningStatusView');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, ELAPSED_TICK_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      title={t('queuedRunTitle')}
      description={t('queuedRunBody')}
      action={
        admittedAt && (
          // Hidden from assistive tech: a per-second change would be re-announced by the live region.
          <span aria-hidden="true" data-testid="queued-run-elapsed">
            <Text as="span" variant="meta">
              {t('queuedRunElapsed', {
                elapsed: formatElapsed(admittedAt, now),
              })}
            </Text>
          </span>
        )
      }
    />
  );
};
