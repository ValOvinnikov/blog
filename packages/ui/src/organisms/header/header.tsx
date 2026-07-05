import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '../../lib/compound';
import { HeaderActions } from './components/actions/header-actions';
import { HeaderBrand } from './components/brand/header-brand';
import { HeaderNav } from './components/nav/header-nav';
import { headerVariants } from './header-variants';

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
      className={headerVariants({ class: className })}
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
