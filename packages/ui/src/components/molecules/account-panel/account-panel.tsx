import {
  A_AS_CONST,
  ACCOUNT_PANEL_STYLE,
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TIconName,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import type { Ref } from 'react';

import {
  accountPanelVariants,
  type TAccountPanelVariants,
} from './account-panel-variants';
import {
  AccountPanelIdentity,
  type IAccountPanelUser,
} from './components/identity/account-panel-identity';
import { AccountPanelTile } from './components/tile/account-panel-tile';

export interface IAccountPanelLink {
  href: string;
  label: string;
  description: string;
}

export interface IAccountPanelLinks {
  bookmarks: IAccountPanelLink;
  settings: IAccountPanelLink;
}

export interface IAccountPanelSignOut {
  label: string;
  onClick: () => void;
}

export interface IAccountPanelSurface {
  id: string;
  isOpen: boolean;
  ariaLabel: string;
}

export type TAccountPanelProps = IWithClassName &
  IWithDataTestId & {
    appearance: NonNullable<TAccountPanelVariants['appearance']>;
    user: IAccountPanelUser;
    onImageError?: () => void;
    links: IAccountPanelLinks;
    linkAs?: TAnchorElementType;
    signOut: IAccountPanelSignOut;
    panel: IAccountPanelSurface;
    ref?: Ref<HTMLDivElement>;
  };

/** The signed-in reader's account menu, in one of three layouts a site owner picks: a compact card, a profile header, or a hub of described tiles. */
export const AccountPanel = ({
  appearance,
  user,
  onImageError,
  links,
  linkAs = A_AS_CONST,
  signOut,
  panel,
  ref,
  className,
  dataTestId,
}: TAccountPanelProps) => {
  const { id, isOpen, ariaLabel } = panel;
  const s = accountPanelVariants({ appearance });
  const isCard = appearance === ACCOUNT_PANEL_STYLE.CARD;
  const isHub = appearance === ACCOUNT_PANEL_STYLE.HUB;
  const destinations: { icon: TIconName; link: IAccountPanelLink }[] = [
    { icon: ICONS.BOOKMARK, link: links.bookmarks },
    { icon: ICONS.SETTINGS, link: links.settings },
  ];

  const signOutItem = (
    <PopoverMenu.Item
      variant={isCard ? undefined : 'outlined'}
      icon={isHub ? undefined : <Icon name={ICONS.POWER} size={SIZE.SM} />}
      onClick={signOut.onClick}
      className={s.signOut()}
    >
      {signOut.label}
    </PopoverMenu.Item>
  );

  return (
    <PopoverMenu.Panel
      ref={ref}
      id={id}
      isOpen={isOpen}
      ariaLabel={ariaLabel}
      dataTestId={dataTestId}
      className={s.panel({ class: className })}
    >
      <AccountPanelIdentity
        appearance={appearance}
        user={user}
        onImageError={onImageError}
      />
      {isCard && <PopoverMenu.Separator />}
      <div className={s.links()}>
        {destinations.map(({ icon, link }) =>
          isHub ? (
            <AccountPanelTile
              key={link.href}
              href={link.href}
              label={link.label}
              description={link.description}
              icon={icon}
              linkAs={linkAs}
            />
          ) : (
            <PopoverMenu.Item
              key={link.href}
              as={linkAs}
              href={link.href}
              icon={<Icon name={icon} size={SIZE.SM} />}
            >
              {link.label}
            </PopoverMenu.Item>
          ),
        )}
      </div>
      {isCard && <PopoverMenu.Separator />}
      {isCard ? signOutItem : <div className={s.footer()}>{signOutItem}</div>}
    </PopoverMenu.Panel>
  );
};
