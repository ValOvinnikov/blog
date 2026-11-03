import type { IWithChildren } from '@blog/config/react';
import { tv } from '@platform/utils/tv/tv';
import type { ReactNode } from 'react';

const domainNameVariants = tv({
  base: ['font-admin-mono font-medium'],
});

const DomainName = ({ children }: IWithChildren) => (
  <span className={domainNameVariants()}>{children}</span>
);

export const domainNameTag = {
  domainName: (chunks: ReactNode) => <DomainName>{chunks}</DomainName>,
};
