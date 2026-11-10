import type { IWithChildren } from '@blog/config/react';
import { LookSubheading } from '@platform/components/features/look/look-form/components/look-subheading';
import { useId } from 'react';

import { lookSubsectionVariants } from './look-subsection-variants';

export type TLookSubsectionProps = IWithChildren & {
  heading: string;
};

export const LookSubsection = ({ heading, children }: TLookSubsectionProps) => {
  const headingId = useId();

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={lookSubsectionVariants()}
    >
      <LookSubheading id={headingId}>{heading}</LookSubheading>
      {children}
    </div>
  );
};
