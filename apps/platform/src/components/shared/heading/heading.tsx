import type { ReactNode, Ref } from 'react';

import { headingVariants, type THeadingVariants } from './heading-variants';

const HEADING_TAGS = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
} as const;

export type THeadingLevel = keyof typeof HEADING_TAGS;

export type THeadingProps = {
  level: THeadingLevel;
  size: NonNullable<THeadingVariants['size']>;
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLHeadingElement>;
  tabIndex?: number;
  id?: string;
};

export const Heading = ({
  level,
  size,
  children,
  className,
  ref,
  tabIndex,
  id,
}: THeadingProps) => {
  const Tag = HEADING_TAGS[level];

  return (
    <Tag
      id={id}
      ref={ref}
      tabIndex={tabIndex}
      className={headingVariants({ size, class: className })}
    >
      {children}
    </Tag>
  );
};
