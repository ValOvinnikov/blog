import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

export type TCtaModuleFootnoteProps = IWithClassName &
  IWithDataTestId & { children?: ReactNode };

/** The fine-print slot under a `CtaModule`'s actions. */
export const CtaModuleFootnote = ({
  className,
  dataTestId,
  children,
}: TCtaModuleFootnoteProps) => (
  <p className={className} data-testid={dataTestId}>
    {children}
  </p>
);
