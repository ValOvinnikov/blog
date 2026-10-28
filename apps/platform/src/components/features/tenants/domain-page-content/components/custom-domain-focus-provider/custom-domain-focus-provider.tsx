'use client';

import type { TMaybeNull } from '@blog/config';
import {
  CustomDomainFocusContext,
  type TCustomDomainFocus,
} from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type TCustomDomainFocusProviderProps = {
  children: ReactNode;
};

export const CustomDomainFocusProvider = ({
  children,
}: TCustomDomainFocusProviderProps) => {
  const [heading, setHeading] = useState<TMaybeNull<HTMLHeadingElement>>(null);
  const staleHeading = useRef<TMaybeNull<HTMLHeadingElement>>(null);
  const isFocusRequested = useRef(false);
  const latestHeading = useRef<TMaybeNull<HTMLHeadingElement>>(null);

  const registerHeading = useCallback(
    (next: TMaybeNull<HTMLHeadingElement>) => {
      latestHeading.current = next;
      setHeading(next);
    },
    [],
  );

  const requestFocus = useCallback(() => {
    staleHeading.current = latestHeading.current;
    isFocusRequested.current = true;
  }, []);

  useEffect(() => {
    if (!isFocusRequested.current || !heading) return;
    if (heading === staleHeading.current) return;
    isFocusRequested.current = false;
    heading.focus();
  }, [heading]);

  const value = useMemo<TCustomDomainFocus>(
    () => ({ registerHeading, requestFocus }),
    [registerHeading, requestFocus],
  );

  return (
    <CustomDomainFocusContext value={value}>
      {children}
    </CustomDomainFocusContext>
  );
};
