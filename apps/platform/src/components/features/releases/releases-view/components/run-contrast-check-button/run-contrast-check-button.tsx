'use client';

import { ACTION_OUTCOME, SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { useToast } from '@platform/context/toast-provider';
import {
  startContrastCheckAction,
  type TStartContrastCheckRefusal,
} from '@platform/server/releases/start-contrast-check-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

const REFUSAL_KEYS = {
  [ACTION_OUTCOME.BLOCKED]: 'alreadyRunning',
  [ACTION_OUTCOME.UNAVAILABLE]: 'githubUnavailable',
  [ACTION_OUTCOME.SERVER_ERROR]: 'startFailed',
} satisfies Record<TStartContrastCheckRefusal, string>;

export type TRunContrastCheckButtonProps = {
  isRunning: boolean;
};

export const RunContrastCheckButton = ({
  isRunning,
}: TRunContrastCheckButtonProps) => {
  const t = useTranslations('runContrastCheckButton');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasStarted, setHasStarted] = useState(false);

  const handleClick = () => {
    startTransition(async () => {
      const result = await startContrastCheckAction();

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        setHasStarted(true);
        toast.success({ message: t('started') });
        router.refresh();
        return;
      }

      toast.error({ message: t(REFUSAL_KEYS[result.outcome]) });
    });
  };

  return (
    <Button
      variant="primary"
      size={SIZE.SM}
      isDisabled={isRunning || hasStarted}
      isPending={isPending}
      pendingLabel={t('starting')}
      onClick={handleClick}
    >
      {t('label')}
    </Button>
  );
};
