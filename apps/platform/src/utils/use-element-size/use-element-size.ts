import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import type { TElementSize } from '@platform/utils/device-frame-scale/device-frame-scale';
import { useEffect, useState, type RefObject } from 'react';

export const useElementSize = (
  ref: RefObject<TMaybeNull<Element>>,
): TMaybeUndefined<TElementSize> => {
  const [size, setSize] = useState<TMaybeUndefined<TElementSize>>();

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous?.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return size;
};
