import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { FooterCopyright } from './components/copyright/footer-copyright';
import { FooterNav } from './components/nav/footer-nav';
import { footerVariants } from './footer-variants';

const FooterParts = {
  Nav: FooterNav,
  Copyright: FooterCopyright,
} satisfies Record<string, ElementType>;

export type TFooterProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<typeof FooterParts>;
  };

/**
 * Footer — the site footer shell; composes `Footer.Nav` and `Footer.Copyright`
 * slots into a `<footer>`. Structure only — each slot owns its own content.
 */
const FooterRoot = ({ children, className, dataTestId }: TFooterProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, FooterParts);
  return (
    <footer
      className={footerVariants({ class: className })}
      data-testid={dataTestId}
    >
      {slots.Copyright}
      {slots.Nav}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </footer>
  );
};

export const Footer: TCompoundComponent<typeof FooterRoot, typeof FooterParts> =
  Object.assign(FooterRoot, FooterParts);
