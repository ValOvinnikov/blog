import { type IWithClassName, type IWithDataTestId, Size } from '@blog/config';
import { headingTags, type THeadingLevel } from '@blog/ui/lib/react';
import type { CSSProperties, ReactNode } from 'react';

import { headingVariants, type THeadingVariants } from './heading-variants';

export type THeadingProps = IWithClassName &
  IWithDataTestId & {
    level: THeadingLevel;
    visual?: THeadingVariants['visual'];
    size?: THeadingVariants['size'];
    id?: string;
    style?: CSSProperties;
    children?: ReactNode;
  };

type TSize = NonNullable<THeadingVariants['size']>;

const defaultSizes: Record<THeadingLevel, TSize> = {
  1: Size.XXL,
  2: Size.XL,
  3: Size.LG,
  4: Size.MD,
};

/**
 * Semantic heading — `level` picks the rendered `h1`–`h4` tag for the page
 * outline, independently of `visual`, which drives the rendered size instead
 * (e.g. a deep Portable Text heading can still read as subordinate to the
 * page's title).
 *
 * @example
 * <Heading level={2} visual="prose-h2">{block.text}</Heading>
 * <Heading level={3} visual="prose-h3">{block.text}</Heading>
 * <Heading level={4} visual="prose-h4">{block.text}</Heading>
 */
export const Heading = ({
  level,
  visual,
  size,
  className,
  dataTestId,
  id,
  style,
  children,
}: THeadingProps) => {
  const Tag = headingTags[level];
  return (
    <Tag
      id={id}
      style={style}
      className={headingVariants({
        visual,
        size: visual ? undefined : (size ?? defaultSizes[level]),
        class: className,
      })}
      data-testid={dataTestId}
    >
      {children}
    </Tag>
  );
};
