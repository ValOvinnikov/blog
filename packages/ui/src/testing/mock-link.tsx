import type { IWithClassName } from '@blog/config';
import type { ReactNode } from 'react';

export const MOCK_LINK_TEST_ID = 'mock-link';

export const MockLink = ({
  href,
  className,
  children,
}: IWithClassName & { href?: string; children?: ReactNode }) => (
  <a href={href} className={className} data-testid={MOCK_LINK_TEST_ID}>
    {children}
  </a>
);
