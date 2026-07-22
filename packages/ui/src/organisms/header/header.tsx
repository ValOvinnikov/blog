import type { IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  Fragment,
} from 'react';

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
      {(slots.Nav || slots.Actions) && (
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          {slots.Nav}
          {slots.Actions}
        </div>
      )}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </header>
  );
};

export const Header: TCompoundComponent<typeof HeaderRoot, typeof HeaderParts> =
  Object.assign(HeaderRoot, HeaderParts);
