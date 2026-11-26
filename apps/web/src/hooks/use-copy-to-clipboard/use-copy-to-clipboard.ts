'use client';

import { CLIPBOARD_LOG } from '@web/constants/clipboard';
import { logger } from '@web/utils/logger/logger';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useState } from 'react';

const DEFAULT_RESET_DELAY_MS = 2000;

export const useCopyToClipboard = (resetMs = DEFAULT_RESET_DELAY_MS) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const timeout = setTimeout(() => setIsCopied(false), resetMs);

    return () => clearTimeout(timeout);
  }, [isCopied, resetMs]);

  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setIsCopied(true))
      .catch((error: unknown) => {
        logger.error(CLIPBOARD_LOG.WRITE_FAILED, { error });
        reportClientError(CLIPBOARD_LOG.WRITE_FAILED, error);
      });
  };

  return { isCopied, copy };
};
