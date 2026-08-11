import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import {
  ctaModuleVariants,
  type TCtaModuleVariants,
} from './cta-module-variants';

export interface ICtaModuleProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>, IWithDataTestId {
  heading: string;
  headingId?: string;
  text?: string;
  action?: ReactNode;
  /**
   * Drops this component's own top margin and vertical padding. Set when a
   * parent (e.g. `Section`) already owns the vertical spacing around it, so
   * the two don't stack.
   */
  wrapped?: TCtaModuleVariants['wrapped'];
}

/**
 * CtaModule — page-builder organism rendering a heading, optional supporting
 * text, and an optional action slot. `action` is a fully rendered link/button
 * passed in by the web layer — this component never builds the anchor itself.
 * The action wrapper is omitted entirely when `action` is absent.
 */
export const CtaModule = ({
  heading,
  headingId,
  text,
  action,
  className,
  dataTestId,
  wrapped,
  ...rest
}: ICtaModuleProps) => {
  const s = ctaModuleVariants({ wrapped });

  return (
    <div
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      <h2 id={headingId} className={s.heading()}>
        {heading}
      </h2>
      {text && <p className={s.text()}>{text}</p>}
      {action && <div className={s.action()}>{action}</div>}
    </div>
  );
};
