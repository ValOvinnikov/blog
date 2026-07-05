import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '../../lib/compound';
import { footerVariants } from './footer-variants';

const s = footerVariants();

interface IFooterCopyrightProps extends Omit<
  ComponentPropsWithoutRef<'p'>,
  'children'
> {
  title: string;
}

export const FooterCopyright = ({
  title,
  className,
  ...rest
}: IFooterCopyrightProps) => (
  <p className={s.copyright({ class: className })} {...rest}>
    &copy; {new Date().getFullYear()} {title}
  </p>
);

export const FooterNav = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'nav'>) => (
  <nav
    aria-label="Footer navigation"
    className={s.nav({ class: className })}
    {...rest}
  />
);

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
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Nav}
      {slots.Copyright}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </footer>
  );
};

export const Footer: TCompoundComponent<typeof FooterRoot, typeof FooterParts> =
  Object.assign(FooterRoot, FooterParts);
