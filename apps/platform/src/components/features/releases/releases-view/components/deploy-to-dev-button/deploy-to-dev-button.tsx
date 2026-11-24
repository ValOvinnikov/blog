'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { useToast } from '@platform/context/toast-provider';
import { startDevDeployAction } from '@platform/server/releases/start-dev-deploy-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess, SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export const DeployToDevButton = () => {
  const t = useTranslations('deployToDevButton');
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await settleAction(startDevDeployAction());

      if (isOutcomeSuccess(result)) {
        toast.success({ message: t('started') });
        return;
      }

      toast.error({ message: t('startFailed') });
    });
  };

  return (
    <Button
      variant={BUTTON_VARIANT.SECONDARY}
      size={SIZE.SM}
      focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
      isPending={isPending}
      pendingLabel={t('starting')}
      onClick={handleClick}
    >
      {t('label')}
    </Button>
  );
};
