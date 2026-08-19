import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  ctaModuleVariants,
  type TCtaModuleVariants,
} from './cta-module-variants';

export type TCtaModuleProps = IWithClassName &
  IWithDataTestId & {
    heading?: string;
    headingId?: string;
    supportingText?: string;
    action?: ReactNode;
    align?: TCtaModuleVariants['align'];
    /**
     * Drops this component's own top margin and vertical padding. Set when a
     * parent (e.g. `Section`) already owns the vertical spacing around it, so
     * the two don't stack.
     */
    wrapped?: TCtaModuleVariants['wrapped'];
  };

/**
 * CtaModule — page-builder organism rendering an optional heading, optional
 * supporting text, and an optional action slot. `action` is a fully rendered
 * link/button passed in by the web layer — this component never builds the
 * anchor itself. The heading/action wrappers are omitted entirely when
 * absent.
 */
export const CtaModule = ({
  heading,
  headingId,
  supportingText,
  action,
  align,
  className,
  dataTestId,
  wrapped,
}: TCtaModuleProps) => {
  const s = ctaModuleVariants({ wrapped, align });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {heading && (
        <h2 id={headingId} className={s.heading()}>
          {heading}
        </h2>
      )}
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
      {action && <div className={s.action()}>{action}</div>}
    </div>
  );
};
