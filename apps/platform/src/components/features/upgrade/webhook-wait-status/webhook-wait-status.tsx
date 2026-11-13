'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Spinner } from '@platform/components/shared/spinner';
import { useTranslations } from 'next-intl';

type TWebhookWaitCopy = { title: string; description: string };

export type TWebhookWaitStatusProps = {
  isSlow: boolean;
  isConfirmed?: boolean;
  confirming: TWebhookWaitCopy;
  slow: TWebhookWaitCopy;
  confirmed?: TWebhookWaitCopy;
  onCheckAgain: () => void;
};

export const WebhookWaitStatus = ({
  isSlow,
  isConfirmed = false,
  confirming,
  slow,
  confirmed,
  onCheckAgain,
}: TWebhookWaitStatusProps) => {
  const t = useTranslations('upgradePage');

  if (isConfirmed && confirmed) {
    return <Alert type={ALERT_TYPE.SUCCESS} role="status" {...confirmed} />;
  }
  if (isSlow) {
    return (
      <Alert
        type={ALERT_TYPE.WARNING}
        role="status"
        {...slow}
        action={
          <Button size={SIZE.SM} onClick={onCheckAgain}>
            {t('checkAgain')}
          </Button>
        }
      />
    );
  }
  return (
    <Alert
      type={ALERT_TYPE.INFO}
      role="status"
      {...confirming}
      action={
        <span aria-hidden="true">
          <Spinner label="" />
        </span>
      }
    />
  );
};
