import { Size } from '@blog/config';
import { type HTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { headingVariants } from './heading-variants';

export type THeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level: 1 | 2 | 3 | 4;
  size?: VariantProps<typeof headingVariants>['size'];
};

type TSize = NonNullable<VariantProps<typeof headingVariants>['size']>;

const defaultSizes: Record<1 | 2 | 3 | 4, TSize> = {
  1: Size.XXL,
  2: Size.XL,
  3: Size.LG,
  4: Size.MD,
};

export function Heading({ level, size, className, ...rest }: THeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={headingVariants({
        size: size ?? defaultSizes[level],
        class: className,
      })}
      {...rest}
    />
  );
}
