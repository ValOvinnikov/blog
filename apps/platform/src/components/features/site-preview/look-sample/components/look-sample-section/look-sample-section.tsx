import type { IWithChildren } from '@blog/config/react';
import { Heading } from '@blog/ui/components/atoms/heading';
import { useId } from 'react';

import { lookSampleSectionVariants } from './look-sample-section-variants';

export type TLookSampleSectionProps = IWithChildren & {
  heading: string;
};

export const LookSampleSection = ({
  heading,
  children,
}: TLookSampleSectionProps) => {
  const headingId = useId();
  const { root, heading: headingClass } = lookSampleSectionVariants();

  return (
    <section aria-labelledby={headingId} className={root()}>
      <Heading
        level={2}
        visual="preview"
        id={headingId}
        className={headingClass()}
      >
        {heading}
      </Heading>
      {children}
    </section>
  );
};
