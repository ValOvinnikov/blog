import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { ctaModuleVariants } from './cta-module-variants';

export interface ICtaModuleProps
  extends
    Omit<ComponentPropsWithoutRef<'section'>, 'children'>,
    IWithDataTestId {
  heading: string;
  headingId?: string;
  text?: string;
  action: ReactNode;
}

/**
 * CtaModule — page-builder organism rendering a heading, optional supporting
 * text, and an action slot. `action` is a fully rendered link/button passed
 * in by the web layer — this component never builds the anchor itself.
 */
export const CtaModule = ({
  heading,
  headingId,
  text,
  action,
  className,
  dataTestId,
  ...rest
}: ICtaModuleProps) => {
  const s = ctaModuleVariants();

  return (
    <section
      aria-labelledby={headingId}
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <h2 id={headingId} className={s.heading()}>
        {heading}
      </h2>
      {text && <p className={s.text()}>{text}</p>}
      <div className={s.action()}>{action}</div>
    </section>
  );
};
