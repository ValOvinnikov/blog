'use client';

import {
  BrandLockup,
  type TBrandLockupProps,
} from '@shinefold/ui/components/molecules/brand-lockup';
import { useImageLoadFailure } from '@web/hooks/use-image-load-failure';
import { useRef } from 'react';

export const FallbackBrandLockup = ({
  src,
  darkSrc,
  ...props
}: TBrandLockupProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasFailed = useImageLoadFailure(containerRef, src);
  const hasDarkFailed = useImageLoadFailure(containerRef, darkSrc);

  return (
    <span ref={containerRef} className="contents">
      <BrandLockup
        src={hasFailed ? undefined : src}
        darkSrc={hasDarkFailed ? undefined : darkSrc}
        {...props}
      />
    </span>
  );
};
