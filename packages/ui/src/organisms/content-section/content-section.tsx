import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { contentSectionVariants } from './content-section-variants';

export interface IContentSectionProps
  extends
    Omit<ComponentPropsWithoutRef<'section'>, 'children' | 'title'>,
    IWithDataTestId {
  children: ReactNode;
  title: ReactNode;
  titleId: string;
}

export const ContentSection = ({
  children,
  className,
  dataTestId,
  title,
  titleId,
  ...rest
}: IContentSectionProps) => {
  const s = contentSectionVariants();

  return (
    <section
      aria-labelledby={titleId}
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <h2 id={titleId} className={s.heading()}>
        {title}
      </h2>
      {children}
    </section>
  );
};
