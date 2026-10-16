import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { cloneElement, Fragment, type ElementType } from 'react';

import { LogoTileDarkLogo } from './components/dark-logo/logo-tile-dark-logo';
import { LogoTileLogo } from './components/logo/logo-tile-logo';
import { logoTileVariants, type TLogoTileVariants } from './logo-tile-variants';

const LogoTileParts = {
  Logo: LogoTileLogo,
  DarkLogo: LogoTileDarkLogo,
  Link: TextLink,
} satisfies Record<string, ElementType>;

export type TLogoTileProps = IWithClassName &
  IWithDataTestId & {
    isInteractive?: TLogoTileVariants['isInteractive'];
    children?: TCompoundChildren<typeof LogoTileParts>;
  };

/** A fixed-size card that frames a single logo, so transparent and opaque-background assets sit inside identical bounds. */
const LogoTileRoot = ({
  isInteractive,
  children,
  className,
  dataTestId,
}: TLogoTileProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, LogoTileParts);
  const s = logoTileVariants({ isInteractive });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {slots.DarkLogo ? (
        <div className={s.lightLogo()}>{slots.Logo}</div>
      ) : (
        slots.Logo
      )}
      {slots.DarkLogo}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
      {slots.Link &&
        cloneElement(slots.Link, {
          isStretched: true,
          className: s.link({ class: slots.Link.props.className }),
        })}
    </div>
  );
};

export const LogoTile: TCompoundComponent<
  typeof LogoTileRoot,
  typeof LogoTileParts
> = Object.assign(LogoTileRoot, LogoTileParts);
