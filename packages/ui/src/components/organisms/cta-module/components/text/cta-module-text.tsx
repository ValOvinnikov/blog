import type { IWithClassName } from '@blog/config';
import { Prose } from '@blog/ui/components/atoms/prose';
import type { ReactNode } from 'react';

export type TCtaModuleTextProps = IWithClassName & {
  supportingText?: string;
  children?: ReactNode;
};

/** The copy slot under a `CtaModule` heading: a plain supporting line, then rich content set as prose. */
export const CtaModuleText = ({
  supportingText,
  className,
  children,
}: TCtaModuleTextProps) => (
  <>
    {supportingText && <p className={className}>{supportingText}</p>}
    {children && <Prose className={className}>{children}</Prose>}
  </>
);
