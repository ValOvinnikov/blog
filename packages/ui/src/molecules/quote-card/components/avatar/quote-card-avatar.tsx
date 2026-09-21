import type { ReactNode } from 'react';

export type TQuoteCardAvatarProps = {
  children: ReactNode;
};

/** The avatar slot of a `QuoteCard`; positions the caller's own `Avatar` element beside the quoted person's name. */
export const QuoteCardAvatar = ({ children }: TQuoteCardAvatarProps) =>
  children;
