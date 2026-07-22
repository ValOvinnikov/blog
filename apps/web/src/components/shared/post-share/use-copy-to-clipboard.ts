'use client';

import { useEffect, useState } from 'react';

const DEFAULT_RESET_DELAY_MS = 2000;

/**
 * useCopyToClipboard — writes text to `navigator.clipboard` and exposes a
 * `isCopied` flag that auto-resets after `resetMs`.
 */
export function useCopyToClipboard(resetMs = DEFAULT_RESET_DELAY_MS) {
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
      .catch((error: unknown) => console.error('Failed to copy link:', error));
  };

  return { isCopied, copy };
}
