import { type IWithDataTestId, Size } from '@blog/config';
import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { headingVariants } from './heading-variants';

export type THeadingProps = HTMLAttributes<HTMLHeadingElement> &
  IWithDataTestId & {
    level: 1 | 2 | 3 | 4;
    visual?: VariantProps<typeof headingVariants>['visual'];
    size?: VariantProps<typeof headingVariants>['size'];
  };

type TSize = NonNullable<VariantProps<typeof headingVariants>['size']>;
type THeadingTag = 'h1' | 'h2' | 'h3' | 'h4';

const defaultSizes: Record<1 | 2 | 3 | 4, TSize> = {
  1: Size.XXL,
  2: Size.XL,
  3: Size.LG,
  4: Size.MD,
};

const headingTags: Record<1 | 2 | 3 | 4, THeadingTag> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
};

export const Heading = ({
  level,
  visual,
  size,
  className,
  dataTestId,
  ...rest
}: THeadingProps) => {
  const Tag = headingTags[level];
  return (
    <Tag
      className={headingVariants({
        visual,
        size: visual ? undefined : (size ?? defaultSizes[level]),
        class: className,
      })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
