'use client';

import { logger } from '@web/utils/logger/logger';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useState } from 'react';

const DEFAULT_RESET_DELAY_MS = 2000;

/**
 * useCopyToClipboard — writes text to `navigator.clipboard` and exposes a
 * `isCopied` flag that auto-resets after `resetMs`.
 */
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
        logger.error('copy_to_clipboard.write_failed', { error });
        reportClientError('copy_to_clipboard.write_failed', error);
      });
  };

  return { isCopied, copy };
};
