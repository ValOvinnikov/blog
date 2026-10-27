import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { HeaderActions } from './components/actions/header-actions';
import { HeaderBrand } from './components/brand/header-brand';
import { HeaderNav } from './components/nav/header-nav';
import { headerVariants, type THeaderVariants } from './header-variants';

const HeaderParts = {
  Brand: HeaderBrand,
  Nav: HeaderNav,
  Actions: HeaderActions,
} satisfies Record<string, ElementType>;

export type THeaderProps = IWithClassName &
  IWithDataTestId & {
    layout?: THeaderVariants['layout'];
    barStyle?: THeaderVariants['barStyle'];
    children?: TCompoundChildren<typeof HeaderParts>;
  };

/** The site header shell; arranges a `Header.Brand` slot and the navigation for wide screens by `layout`, and sits full width or floating by `barStyle`. */
const HeaderRoot = ({
  layout,
  barStyle,
  children,
  className,
  dataTestId,
}: THeaderProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, HeaderParts);
  const { root, inner, navActionsGroup } = headerVariants({ layout, barStyle });
  return (
    <header className={root({ class: className })} data-testid={dataTestId}>
      <div className={inner()}>
        {slots.Brand}
        {(slots.Nav || slots.Actions) && (
          <div className={navActionsGroup()}>
            {slots.Nav}
            {slots.Actions}
          </div>
        )}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
    </header>
  );
};

export const Header: TCompoundComponent<typeof HeaderRoot, typeof HeaderParts> =
  Object.assign(HeaderRoot, HeaderParts);
