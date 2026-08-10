import type { IWithDataTestId, TAppearance } from '@blog/config';
import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType, ReactNode } from 'react';

import { sectionVariants } from './section-variants';

type TSectionOwnProps = {
  appearance?: TAppearance;
  children: ReactNode;
  className?: string;
} & IWithDataTestId;

export type TSectionProps<C extends ElementType = 'div'> = TPolymorphicProps<
  C,
  TSectionOwnProps
>;

/**
 * Section — the appearance wrapper every page-builder module renders inside;
 * maps an optional `appearance` object (background tone, spacing, container
 * width, alignment, divider) to token-backed classes, falling back per-field
 * to today's plain layout when `appearance` (or any of its fields) is unset.
 */
export const Section = <C extends ElementType = 'div'>({
  as,
  appearance,
  children,
  className,
  dataTestId,
  ...rest
}: TSectionProps<C>) => {
  const Component = (as ?? 'div') as ElementType;
  const s = sectionVariants({
    background: appearance?.background,
    spacingTop: appearance?.spacingTop,
    spacingBottom: appearance?.spacingBottom,
    containerWidth: appearance?.containerWidth,
    align: appearance?.align,
    divider: appearance?.divider,
  });

  return (
    <Component
      data-testid={dataTestId}
      className={s.root({ class: className })}
      {...rest}
    >
      <div className={s.inner()}>{children}</div>
    </Component>
  );
};
