'use client';

import type { TMaybeUndefined } from '@blog/config';
import { useEffect, useRef, useState } from 'react';

// `decode()` settles even when the image failed before hydration, which a React `onError` would miss.
export const useImageLoadFailure = <T extends HTMLElement>(
  src: TMaybeUndefined<string>,
) => {
  const containerRef = useRef<T>(null);
  const [failedSrc, setFailedSrc] = useState<TMaybeUndefined<string>>();

  useEffect(() => {
    const image = containerRef.current?.querySelector('img');
    if (!src || !image) {
      return;
    }
    let isCurrent = true;
    image.decode().catch(() => {
      if (isCurrent) {
        setFailedSrc(src);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [src]);

  return { containerRef, hasFailed: src !== undefined && failedSrc === src };
};
