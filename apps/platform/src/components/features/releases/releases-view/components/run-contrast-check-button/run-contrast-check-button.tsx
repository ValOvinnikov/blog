'use client';

import { ACTION_OUTCOME, SIZE, type TOutcome } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { RELEASE_REFUSAL } from '@platform/constants/release';
import { useToast } from '@platform/context/toast-provider';
import { startContrastCheckAction } from '@platform/server/releases/start-contrast-check-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const REFUSAL_KEYS = {
  [RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING]: 'alreadyRunning',
} satisfies Record<typeof RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING, string>;

const failureKey = (
  result: Exclude<
    Awaited<ReturnType<typeof startContrastCheckAction>>,
    TOutcome<typeof ACTION_OUTCOME.SUCCESS>
  >,
) => {
  if (result.outcome === ACTION_OUTCOME.REFUSED) {
    return REFUSAL_KEYS[result.reason];
  }
  return result.outcome === ACTION_OUTCOME.UNAVAILABLE
    ? 'githubUnavailable'
    : 'startFailed';
};

export type TRunContrastCheckButtonProps = {
  isRunning: boolean;
  onStarted: () => void;
};

export const RunContrastCheckButton = ({
  isRunning,
  onStarted,
}: TRunContrastCheckButtonProps) => {
  const t = useTranslations('runContrastCheckButton');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startContrastCheckAction();

      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        onStarted();
        toast.success({ message: t('started') });
        router.refresh();
        return;
      }

      toast.error({ message: t(failureKey(result)) });
    });
  };

  return (
    <Button
      variant={BUTTON_VARIANT.PRIMARY}
      size={SIZE.SM}
      focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
      isDisabled={isRunning}
      isPending={isPending}
      pendingLabel={t('starting')}
      onClick={handleClick}
    >
      {t('label')}
    </Button>
  );
};
