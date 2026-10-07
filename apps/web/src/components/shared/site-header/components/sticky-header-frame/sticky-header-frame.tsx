'use client';

import { useHeightCssVariable } from '@web/hooks/use-height-css-variable';
import type { ReactNode } from 'react';

import { stickyHeaderFrameVariants } from './sticky-header-frame-variants';

const SITE_HEADER_HEIGHT_VARIABLE = '--site-header-height';

export const StickyHeaderFrame = ({ children }: { children: ReactNode }) => {
  const ref = useHeightCssVariable<HTMLDivElement>(SITE_HEADER_HEIGHT_VARIABLE);

  return (
    <div ref={ref} className={stickyHeaderFrameVariants()}>
      {children}
    </div>
  );
};
