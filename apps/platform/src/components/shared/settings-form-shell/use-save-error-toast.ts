'use client';

import type { TMaybeUndefined } from '@blog/config';
import { useToast } from '@platform/context/toast-provider';
import { useEffect, useRef } from 'react';

export const useSaveErrorToast = (
  message: TMaybeUndefined<string>,
  isPending: boolean,
) => {
  const toast = useToast();
  const toastIdRef = useRef<TMaybeUndefined<string>>(undefined);

  useEffect(() => {
    if (!message) return;
    toastIdRef.current = toast.error({ message });
  }, [message, toast]);

  useEffect(() => {
    const toastId = toastIdRef.current;
    if (!isPending || !toastId) return;
    toast.dismiss(toastId);
    toastIdRef.current = undefined;
  }, [isPending, toast]);

  useEffect(
    () => () => {
      const toastId = toastIdRef.current;
      if (toastId) toast.dismiss(toastId);
    },
    [toast],
  );
};
