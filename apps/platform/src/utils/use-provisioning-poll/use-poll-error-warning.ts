'use client';

import { useToast } from '@platform/context/toast-provider';
import type { TMaybeNull } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

export const usePollErrorWarning = () => {
  const toast = useToast();
  const t = useTranslations('provisioningStatusView');
  const toastIdRef = useRef<TMaybeNull<string>>(null);

  const show = () => {
    toastIdRef.current ??= toast.warning({ message: t('pollErrorWarning') });
  };

  const dismiss = () => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  return { show, dismiss };
};
