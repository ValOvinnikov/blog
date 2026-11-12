import type { IWithDataTestId, TBrandVariant, TLayout } from '@blog/config';
import {
  buildSectionScopeDeclarations,
  type TSectionAppearance,
} from '@web/utils/build-section-scope-declarations';
import type { CSSProperties, ReactNode } from 'react';

import { sectionVariants } from './section-variants';

export interface ISectionProps extends IWithDataTestId {
  brandVariant: TBrandVariant;
  layout?: TLayout;
  appearance?: TSectionAppearance;
  titleId?: string;
  children: ReactNode;
  className?: string;
}

export const Section = ({
  brandVariant,
  layout,
  appearance,
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
      style={
        appearance &&
        (buildSectionScopeDeclarations(appearance) as CSSProperties)
      }
      data-testid={dataTestId}
    >
      <div className={s.inner()}>{children}</div>
    </section>
  );
};
