'use client';

import {
  BrandLockup,
  type TBrandLockupProps,
} from '@blog/ui/components/molecules/brand-lockup';
import { useImageLoadFailure } from '@web/hooks/use-image-load-failure';

export const FallbackBrandLockup = ({ src, ...props }: TBrandLockupProps) => {
  const { containerRef, hasFailed } = useImageLoadFailure<HTMLSpanElement>(src);

  return (
    <span ref={containerRef} className="contents">
      <BrandLockup src={hasFailed ? undefined : src} {...props} />
    </span>
  );
};
