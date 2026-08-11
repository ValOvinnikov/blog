import type { IWithDataTestId, TAppearance, TBrandVariant } from '@blog/config';
import type { ReactNode } from 'react';

import { sectionVariants } from './section-variants';

export interface ISectionProps extends IWithDataTestId {
  brandVariant: TBrandVariant;
  appearance?: TAppearance;
  titleId: string;
  children: ReactNode;
  className?: string;
}

/**
 * Section — the sole per-module landmark. Full-bleed `<section>` background
 * driven by `brandVariant`, vertical spacing as padding (not margin) so
 * stacked Sections tile edge-to-edge, wrapping a constrained inner `<div>`.
 * Module organisms compose into `children` without rendering their own
 * `<section>` landmark or outer spacing.
 */
export const Section = ({
  brandVariant,
  appearance,
  titleId,
  children,
  className,
  dataTestId,
}: ISectionProps) => {
  const s = sectionVariants({
    brandVariant,
    spacingTop: appearance?.spacingTop,
    spacingBottom: appearance?.spacingBottom,
    containerWidth: appearance?.containerWidth,
    align: appearance?.align,
    divider: appearance?.divider,
  });

  return (
    <section
      aria-labelledby={titleId}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      <div className={s.inner()}>{children}</div>
    </section>
  );
};
