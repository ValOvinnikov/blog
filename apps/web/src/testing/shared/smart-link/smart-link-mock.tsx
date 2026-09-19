import type { ReactNode } from 'react';

export const SmartLinkMock = ({
  href,
  children,
  ...rest
}: {
  href: string;
  children: ReactNode;
}) => (
  <a href={href} {...rest}>
    {children}
  </a>
);
