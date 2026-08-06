import { type IWithDataTestId, Size } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { headingVariants, type THeadingVariants } from './heading-variants';

export type THeadingProps = HTMLAttributes<HTMLHeadingElement> &
  IWithDataTestId & {
    level: 1 | 2 | 3 | 4;
    visual?: THeadingVariants['visual'];
    size?: THeadingVariants['size'];
  };

type TSize = NonNullable<THeadingVariants['size']>;
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
