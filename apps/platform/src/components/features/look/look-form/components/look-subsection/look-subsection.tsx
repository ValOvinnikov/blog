import { Subheading } from '@platform/components/shared/subheading';
import type { IWithChildren } from '@shinefold/config/react';
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
      <Subheading id={headingId}>{heading}</Subheading>
      {children}
    </div>
  );
};
