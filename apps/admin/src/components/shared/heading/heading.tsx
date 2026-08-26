import type { ReactNode } from 'react';

import { headingVariants, type THeadingVariants } from './heading-variants';

const HEADING_TAGS = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
} as const;

type THeadingLevel = keyof typeof HEADING_TAGS;

export type THeadingProps = {
  /** Document-outline depth — picks the rendered `h1`–`h4` tag. */
  level: THeadingLevel;
  /** Visual treatment, independent of `level` — a level-2 heading can render at any size. */
  size: NonNullable<THeadingVariants['size']>;
  children: ReactNode;
  className?: string;
};

export const Heading = ({
  level,
  size,
  children,
  className,
}: THeadingProps) => {
  const Tag = HEADING_TAGS[level];

  return (
    <Tag className={headingVariants({ size, class: className })}>
      {children}
    </Tag>
  );
};
