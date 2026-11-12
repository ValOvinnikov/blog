'use client';

import type { TMaybeNull } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import { useCallback, useMemo, useRef } from 'react';

import {
  TenantOverviewFocusContext,
  type TTenantOverviewFocus,
} from './use-tenant-overview-focus';

export const TenantOverviewFocusProvider = ({ children }: IWithChildren) => {
  const heading = useRef<TMaybeNull<HTMLHeadingElement>>(null);

  const registerHeading = useCallback(
    (next: TMaybeNull<HTMLHeadingElement>) => {
      heading.current = next;
    },
    [],
  );

  const focusHeading = useCallback(() => heading.current?.focus(), []);

  const value = useMemo<TTenantOverviewFocus>(
    () => ({ registerHeading, focusHeading }),
    [registerHeading, focusHeading],
  );

  return (
    <TenantOverviewFocusContext value={value}>
      {children}
    </TenantOverviewFocusContext>
  );
};
