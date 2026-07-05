import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '../../lib/compound';
import { headerVariants } from './header-variants';

const s = headerVariants();

export const HeaderBrand = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'span'>) => (
  <span className={s.brand({ class: className })} {...rest} />
);

export const HeaderNav = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'nav'>) => (
  <nav
    aria-label="Site navigation"
    className={s.nav({ class: className })}
    {...rest}
  />
);

export const HeaderActions = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={s.actions({ class: className })} {...rest} />
);

const HeaderParts = {
  Brand: HeaderBrand,
  Nav: HeaderNav,
  Actions: HeaderActions,
} satisfies Record<string, ElementType>;

export interface IHeaderProps
  extends
    Omit<ComponentPropsWithoutRef<'header'>, 'children'>,
    IWithDataTestId {
  children?: TCompoundChildren<typeof HeaderParts>;
}

const HeaderRoot = ({
  children,
  className,
  dataTestId,
  ...rest
}: IHeaderProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeaderParts);
  return (
    <header
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Brand}
      {slots.Nav}
      {slots.Actions}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </header>
  );
};

export const Header: TCompoundComponent<typeof HeaderRoot, typeof HeaderParts> =
  Object.assign(HeaderRoot, HeaderParts);
