import { tv } from '@platform/utils/tv/tv';
import type { IWithChildren } from '@shinefold/config/react';
import type { ReactNode } from 'react';

const domainNameVariants = tv({
  base: ['font-platform-mono font-medium'],
});

const DomainName = ({ children }: IWithChildren) => (
  <span className={domainNameVariants()}>{children}</span>
);

export const domainNameTag = {
  domainName: (chunks: ReactNode) => <DomainName>{chunks}</DomainName>,
};
