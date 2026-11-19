import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import type { THeadingLevel } from '@shinefold/ui/lib/react';
import type { ReactNode } from 'react';

import { mediaCardTitleVariants } from './media-card-title-variants';

export type TMediaCardTitleProps = IWithClassName &
  IWithDataTestId & {
    level: THeadingLevel;
    isLead?: boolean;
    children?: ReactNode;
  };

/** The title of a `MediaCard`, larger on a lead card. */
export const MediaCardTitle = ({
  level,
  isLead,
  className,
  dataTestId,
  children,
}: TMediaCardTitleProps) => (
  <Heading
    level={level}
    visual={isLead ? TEXT_ROLE.PROSE_H2 : TEXT_ROLE.CARD_TITLE}
    className={mediaCardTitleVariants({ isLead, class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
