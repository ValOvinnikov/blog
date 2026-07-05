import type { IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/compound';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import { FooterCopyright } from './components/copyright/footer-copyright';
import { FooterNav } from './components/nav/footer-nav';
import { footerVariants } from './footer-variants';

const FooterParts = {
  Nav: FooterNav,
  Copyright: FooterCopyright,
} satisfies Record<string, ElementType>;

export interface IFooterProps
  extends
    Omit<ComponentPropsWithoutRef<'footer'>, 'children'>,
    IWithDataTestId {
  children?: TCompoundChildren<typeof FooterParts>;
}

const FooterRoot = ({
  children,
  className,
  dataTestId,
  ...rest
}: IFooterProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, FooterParts);
  return (
    <footer
      className={footerVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
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
