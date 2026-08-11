import type { IWithDataTestId, TBrandVariant, TLayout } from '@blog/config';
import type { ReactNode } from 'react';

import { sectionVariants } from './section-variants';

export interface ISectionProps extends IWithDataTestId {
  brandVariant: TBrandVariant;
  layout?: TLayout;
  titleId?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Section — the sole per-module landmark. Full-bleed `<section>` background
 * driven by `brandVariant`, vertical spacing as padding (not margin) so
 * stacked Sections tile edge-to-edge, wrapping a constrained inner `<div>`.
 * Module organisms compose into `children` without rendering their own
 * `<section>` landmark or outer spacing. `titleId` is optional — a module
 * with no unique heading (e.g. `ContentModule`) renders the landmark without
 * an `aria-labelledby` rather than pointing at an element that never renders.
 */
export const Section = ({
  brandVariant,
  layout,
  titleId,
  children,
  className,
  dataTestId,
}: ISectionProps) => {
  const s = sectionVariants({
    brandVariant,
    spacingTop: layout?.spacingTop,
    spacingBottom: layout?.spacingBottom,
    containerWidth: layout?.containerWidth,
    dividerTop: layout?.dividerTop,
    dividerBottom: layout?.dividerBottom,
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
