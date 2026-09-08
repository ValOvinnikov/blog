import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';
import type { ReactNode } from 'react';

import { postCardTitleVariants } from './post-card-title-variants';

export type TPostCardTitleProps = IWithClassName &
  IWithDataTestId & {
    /** Heading depth for the title — the caller decides based on where the card sits in the page outline. */
    level: THeadingLevel;
    /** Set by `PostCard` on lead cards — renders the title at display size instead of the standard card size. */
    isLead?: boolean;
    children?: ReactNode;
  };

/**
 * PostCardTitle — the post heading inside a `PostCard`, rendered at the
 * caller-specified heading depth with the card title's visual treatment.
 */
export const PostCardTitle = ({
  level,
  isLead,
  className,
  dataTestId,
  children,
}: TPostCardTitleProps) => (
  <Heading
    level={level}
    visual={isLead ? 'post' : 'card'}
    className={postCardTitleVariants({ class: className })}
    dataTestId={dataTestId}
  >
    {children}
  </Heading>
);
