'use client';

import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { type RefObject, useEffect, useState } from 'react';

// `decode()` settles even when the image failed before hydration, which a React `onError` would miss.
export const useImageLoadFailure = (
  containerRef: RefObject<TMaybeNull<HTMLElement>>,
  src: TMaybeUndefined<string>,
) => {
  const [failedSrc, setFailedSrc] = useState<TMaybeUndefined<string>>();

  useEffect(() => {
    const image = Array.from(
      containerRef.current?.querySelectorAll('img') ?? [],
    ).find((candidate) => candidate.getAttribute('src') === src);
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
  }, [containerRef, src]);

  return !isUndefined(src) && failedSrc === src;
};
