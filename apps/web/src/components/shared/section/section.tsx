import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
  TLayout,
} from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import {
  buildSectionScopeDeclarations,
  type TSectionAppearance,
} from '@web/utils/build-section-scope-declarations';
import type { CSSProperties } from 'react';

import { sectionVariants } from './section-variants';

export interface ISectionProps
  extends IWithChildren, IWithClassName, IWithDataTestId {
  brandVariant: TBrandVariant;
  layout?: TLayout;
  appearance?: TSectionAppearance;
  titleId?: string;
}

export type TModuleSection = Pick<
  ISectionProps,
  'brandVariant' | 'layout' | 'appearance'
>;

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
    spacingTop: layout?.spacingTop,
    spacingBottom: layout?.spacingBottom,
    containerWidth: layout?.containerWidth,
    dividerTop: layout?.dividerTop,
    dividerBottom: layout?.dividerBottom,
  });

  return (
    <section
      aria-labelledby={titleId}
      data-skin={brandVariant}
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
