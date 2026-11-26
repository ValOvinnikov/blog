import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
  type THeadingPiece,
} from '@shinefold/config';
import { headingTags, type THeadingLevel } from '@shinefold/ui/lib/react';
import { Fragment, type CSSProperties, type ReactNode } from 'react';

import {
  headingHighlightVariants,
  headingVariants,
  type THeadingVariants,
} from './heading-variants';

export type THeadingProps = IWithClassName &
  IWithDataTestId & {
    level: THeadingLevel;
    visual?: THeadingVariants['visual'];
    id?: string;
    style?: CSSProperties;
  } & (
    | { pieces: readonly THeadingPiece[]; children?: never }
    | { pieces?: never; children?: ReactNode }
  );

const LEVEL_TITLE_ROLE: Record<
  THeadingLevel,
  NonNullable<THeadingVariants['visual']>
> = {
  1: TEXT_ROLE.PAGE_TITLE,
  2: TEXT_ROLE.SECTION_TITLE,
  3: TEXT_ROLE.CARD_TITLE,
  4: TEXT_ROLE.ITEM_TITLE,
};

/** A title in the page's document outline. */
export const Heading = ({
  level,
  visual = LEVEL_TITLE_ROLE[level],
  className,
  dataTestId,
  id,
  style,
  pieces,
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
      {pieces
        ? pieces.map(({ text, isHighlighted }, index) =>
            isHighlighted ? (
              <span key={index} className={headingHighlightVariants()}>
                {text}
              </span>
            ) : (
              <Fragment key={index}>{text}</Fragment>
            ),
          )
        : children}
    </Tag>
  );
};
