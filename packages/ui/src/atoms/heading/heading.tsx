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
 * Semantic heading (`level` picks the rendered `h1`–`h4` tag) with an
 * independent `visual` treatment. `visual` always wins over `size` — pass it
 * whenever the heading's rendered size should be driven by *where* it sits
 * on the page rather than its outline depth.
 *
 * For in-article/body content (e.g. a `PortableTextRenderer` in `apps/web`
 * mapping Portable Text `h2`/`h3`/`h4` blocks), pair `level` with the
 * matching `prose-h2`/`prose-h3`/`prose-h4` visual so body subheadings read
 * as clearly subordinate to the page's own `post`-visual title, however deep
 * the block sits in the document outline:
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
