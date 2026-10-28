'use client';

import type { TMaybeNull } from '@blog/config';
import { useEffect, type RefObject } from 'react';

/** Native popovers outlive a client-side navigation, so the container's popovers are hidden whenever `routeKey` changes. */
export const useHideOpenPopovers = (
  containerRef: RefObject<TMaybeNull<HTMLElement>>,
  routeKey: string,
) => {
  useEffect(() => {
    containerRef.current
      ?.querySelectorAll<HTMLElement>('[popover]')
      .forEach((popover) => popover.hidePopover());
  }, [containerRef, routeKey]);
};
