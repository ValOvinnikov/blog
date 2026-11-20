'use client';

import type { TConfirmDialogActionResult } from '@platform/components/shared/confirm-dialog';
import { useToast } from '@platform/context/toast-provider';
import type { TKeptSamples } from '@platform/server/sample-content/kept-sample';
import { removeSampleContentAction } from '@platform/server/sample-content/remove-sample-content-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  type TMaybeNull,
  isOutcomeRefused,
  isOutcomeSuccess,
} from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

export const useSampleContentRemoval = (tenantId: string) => {
  const t = useTranslations('ownerHomePage.sampleContent');
  const toast = useToast();
  const removedCount = useRef(0);
  const [kept, setKept] = useState<TMaybeNull<TKeptSamples>>(null);

  const onConfirm = async (): Promise<TConfirmDialogActionResult> => {
    const result = await settleAction(removeSampleContentAction(tenantId));
    if (isOutcomeSuccess(result)) {
      const { removedCount: count, keptEdited, keptReferenced } = result;
      removedCount.current = count;
      setKept({ keptEdited, keptReferenced });
      return okResult();
    }
    return errorResult(t(isOutcomeRefused(result) ? 'notWritable' : 'failed'));
  };

  const onConfirmed = () => {
    toast.success({ message: t('done', { count: removedCount.current }) });
  };

  return { kept, onConfirm, onConfirmed };
};
