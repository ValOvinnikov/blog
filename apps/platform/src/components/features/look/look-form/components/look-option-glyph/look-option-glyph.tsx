import type { IWithChildren } from '@blog/config/react';

export const LookOptionGlyph = ({ children }: IWithChildren) => (
  <svg
    aria-hidden={true}
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    {children}
  </svg>
);
