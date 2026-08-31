import { type IWithDataTestId, SIZE } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';
import type { ReactNode } from 'react';

import { plainSectionVariants } from './plain-section-variants';

export interface IPlainSectionProps extends IWithDataTestId {
  heading: ReactNode;
  headingLevel?: THeadingLevel;
  children: ReactNode;
  className?: string;
}

/**
 * PlainSection — the neutral, non-chrome card shell for a `WindowChrome`
 * section (bordered surface + heading + body) when `chromeOn` is false.
 * Keeps the same heading level `WindowChrome.Bar` would have rendered so a
 * plain-mode page's heading outline stays unchanged.
 */
export const PlainSection = ({
  heading,
  headingLevel = 2,
  children,
  className,
  dataTestId,
}: IPlainSectionProps) => {
  const s = plainSectionVariants();

  return (
    <section className={s.root({ class: className })} data-testid={dataTestId}>
      <Heading level={headingLevel} size={SIZE.SM} className={s.heading()}>
        {heading}
      </Heading>
      <div className={s.body()}>{children}</div>
    </section>
  );
};
