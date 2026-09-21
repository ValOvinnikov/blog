import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

export type TQuoteCardAvatarProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The avatar slot of a `QuoteCard`; positions the caller's own `Avatar` element beside the quoted person's name. */
export const QuoteCardAvatar = ({
  className,
  dataTestId,
  children,
}: TQuoteCardAvatarProps) => (
  <div className={className} data-testid={dataTestId}>
    {children}
  </div>
);
