import type { TValueOf } from '@blog/config/utils';
import {
  COPY_STATUS,
  COPY_STATUS_RESET_MS,
} from '@platform/constants/clipboard';
import { useEffect, useState } from 'react';

export type TCopyStatus = TValueOf<typeof COPY_STATUS>;

export const useCopyToClipboard = () => {
  const [status, setStatus] = useState<TCopyStatus>(COPY_STATUS.IDLE);

  useEffect(() => {
    if (status === COPY_STATUS.IDLE) return;

    const timeout = setTimeout(
      () => setStatus(COPY_STATUS.IDLE),
      COPY_STATUS_RESET_MS,
    );

    return () => clearTimeout(timeout);
  }, [status]);

  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setStatus(COPY_STATUS.COPIED))
      .catch(() => setStatus(COPY_STATUS.FAILED));
  };

  return { status, copy };
};
