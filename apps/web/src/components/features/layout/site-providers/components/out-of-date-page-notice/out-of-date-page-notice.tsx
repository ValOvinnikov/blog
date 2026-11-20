'use client';

import { useToast } from '@web/context/toast-provider';
import { useOutOfDateNotice } from '@web/hooks/use-out-of-date-notice';
import { subscribeToPageOutOfDate } from '@web/utils/page-out-of-date';
import { useEffect } from 'react';

export const OutOfDatePageNotice = () => {
  const toast = useToast();
  const notice = useOutOfDateNotice();

  useEffect(
    () => subscribeToPageOutOfDate(() => toast.error(notice)),
    [toast, notice],
  );

  return null;
};
