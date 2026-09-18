import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';
import type { ReactNode } from 'react';

import { mediaCardTitleVariants } from './media-card-title-variants';

export type TMediaCardTitleProps = IWithClassName &
  IWithDataTestId & {
    /** Heading depth for the title — the caller decides based on where the card sits in the page outline. */
    level: THeadingLevel;
    /** Set by `MediaCard` on lead cards — renders the title at display size instead of the standard card size. */
    isLead?: boolean;
    children?: ReactNode;
  };

/**
 * MediaCardTitle — the heading inside a `MediaCard`, rendered at the
 * caller-specified heading depth with the card title's visual treatment.
 */
export const MediaCardTitle = ({
  level,
  isLead,
  className,
  dataTestId,
  children,
}: TMediaCardTitleProps) => (
  <Heading
    level={level}
    visual={isLead ? 'post' : 'card'}
    className={mediaCardTitleVariants({ class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
