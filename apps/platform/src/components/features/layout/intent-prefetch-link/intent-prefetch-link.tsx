'use client';

import { Link } from '@platform/i18n/navigation';
import { type ComponentProps, useState } from 'react';

export type TIntentPrefetchLinkProps = Omit<
  ComponentProps<typeof Link>,
  'prefetch'
>;

/** Prefetches only once pointed at, touched or focused, so a nav of many links does not render every route in the background. */
export const IntentPrefetchLink = ({
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...props
}: TIntentPrefetchLinkProps) => {
  const [hasIntent, setHasIntent] = useState(false);

  return (
    <Link
      {...props}
      prefetch={hasIntent ? null : false}
      onMouseEnter={(event) => {
        setHasIntent(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        setHasIntent(true);
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        setHasIntent(true);
        onFocus?.(event);
      }}
    />
  );
};
