import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
  type TTextRole,
} from '@shinefold/config';
import { headingTags, type THeadingLevel } from '@shinefold/ui/lib/react';
import type { CSSProperties, ReactNode } from 'react';

import { headingVariants, type THeadingVariants } from './heading-variants';

export type THeadingProps = IWithClassName &
  IWithDataTestId & {
    level: THeadingLevel;
    visual?: THeadingVariants['visual'];
    id?: string;
    style?: CSSProperties;
    children?: ReactNode;
  };

const LEVEL_TITLE_ROLE: Record<THeadingLevel, TTextRole> = {
  1: TEXT_ROLE.PAGE_TITLE,
  2: TEXT_ROLE.SECTION_TITLE,
  3: TEXT_ROLE.CARD_TITLE,
  4: TEXT_ROLE.ITEM_TITLE,
};

/** `level` sets the page outline and `visual` the look, so a deep heading can still read as subordinate to the page's title. */
export const Heading = ({
  level,
  visual = LEVEL_TITLE_ROLE[level],
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
      className={headingVariants({ visual, class: className })}
      data-testid={dataTestId}
    >
      {children}
    </Tag>
  );
};
