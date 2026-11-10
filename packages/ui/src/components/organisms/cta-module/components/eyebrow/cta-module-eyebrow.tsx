import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import type { ReactNode } from 'react';

export type TCtaModuleEyebrowProps = IWithClassName &
  IWithDataTestId & { children?: ReactNode };

/** The label slot above a `CtaModule` heading. */
export const CtaModuleEyebrow = ({
  className,
  dataTestId,
  children,
}: TCtaModuleEyebrowProps) => (
  <Eyebrow className={className} dataTestId={dataTestId}>
    {children}
  </Eyebrow>
);
