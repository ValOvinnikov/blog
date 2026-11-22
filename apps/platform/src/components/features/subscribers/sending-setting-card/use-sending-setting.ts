'use client';

import { setEmailNewPostsAction } from '@platform/server/subscribers/set-email-new-posts-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess } from '@shinefold/config';
import { useState, useTransition } from 'react';

export const useSendingSetting = (tenantId: string, isInitiallyOn: boolean) => {
  const [isOn, setIsOn] = useState(isInitiallyOn);
  const [hasFailed, setHasFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const change = (nextIsOn: boolean) => {
    setIsOn(nextIsOn);
    setHasFailed(false);
    startSaving(async () => {
      const result = await settleAction(
        setEmailNewPostsAction(tenantId, nextIsOn),
      );
      if (isOutcomeSuccess(result)) return;
      setIsOn(!nextIsOn);
      setHasFailed(true);
    });
  };

  return { isOn, hasFailed, isSaving, change };
};
