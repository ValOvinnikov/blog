'use client';

import { useInterceptNavigation } from '@platform/context/unsaved-changes-provider';
import { BaseLink } from '@platform/i18n/base-navigation';
import type { ComponentProps } from 'react';

type TGuardedLinkProps = Omit<ComponentProps<typeof BaseLink>, 'href'> & {
  href: string;
};

export const GuardedLink = ({
  href,
  onNavigate,
  ...props
}: TGuardedLinkProps) => {
  const interceptNavigation = useInterceptNavigation();

  return (
    <BaseLink
      {...props}
      href={href}
      onNavigate={(event) => {
        onNavigate?.(event);
        interceptNavigation?.(href, event);
      }}
    />
  );
};
