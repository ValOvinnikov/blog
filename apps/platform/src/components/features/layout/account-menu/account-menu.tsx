'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS, type TMaybeUndefined } from '@blog/config';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Avatar } from '@platform/components/shared/avatar';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import {
  ACCOUNT_MENU_APPEARANCE,
  ACCOUNT_MENU_PLACEMENT,
  type TAccountMenuAppearance,
  type TAccountMenuPlacement,
} from '@platform/constants/account-menu';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { useTranslations } from 'next-intl';
import { startTransition, useRef } from 'react';

import { accountMenuVariants } from './account-menu-variants';

export type TAccount = {
  name: TMaybeUndefined<string>;
  email: TMaybeUndefined<string>;
  roleLine: string;
};

export type TAccountMenuProps = {
  account: TAccount;
  appearance: TAccountMenuAppearance;
};

// The rail trigger ends 12px inside the rail's edge, so 20px clears the rail by 8px.
const POSITIONER_PROPS = {
  [ACCOUNT_MENU_PLACEMENT.FOOT]: { side: 'top', align: 'start', sideOffset: 6 },
  [ACCOUNT_MENU_PLACEMENT.RAIL]: {
    side: 'right',
    align: 'end',
    sideOffset: 20,
  },
  [ACCOUNT_MENU_PLACEMENT.PILL]: {
    side: 'bottom',
    align: 'end',
    sideOffset: 6,
  },
} as const satisfies Record<TAccountMenuPlacement, object>;

export const AccountMenu = ({ account, appearance }: TAccountMenuProps) => {
  const t = useTranslations('account');
  const { isCollapsed } = useSidebarCollapse();
  const signOutRef = useRef<HTMLDivElement>(null);
  const { name, email, roleLine } = account;
  const displayName = name ?? email ?? '';
  const hasEmailLine = Boolean(name && email);

  const placement: TAccountMenuPlacement =
    appearance === ACCOUNT_MENU_APPEARANCE.PILL
      ? ACCOUNT_MENU_PLACEMENT.PILL
      : isCollapsed
        ? ACCOUNT_MENU_PLACEMENT.RAIL
        : ACCOUNT_MENU_PLACEMENT.FOOT;
  const {
    trigger,
    meta,
    nameLine,
    emailLine,
    chevron,
    pillLabel,
    popup,
    header,
    headerName,
    headerEmail,
    headerRole,
    signOutIcon,
  } = accountMenuVariants({ placement });
  const { popup: surfacePopup, item } = menuSurfaceVariants();

  const railProps =
    placement === ACCOUNT_MENU_PLACEMENT.RAIL
      ? {
          title: displayName,
          'aria-label':
            name && email
              ? t('triggerCollapsedLabel', { name, email })
              : t('triggerCollapsedLabelNoName', { email: displayName }),
        }
      : {};

  const handleOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen) {
      signOutRef.current?.focus();
    }
  };

  const handleSignOut = () => {
    startTransition(() => signOutAction());
  };

  return (
    <Menu.Root onOpenChangeComplete={handleOpenChangeComplete}>
      <Menu.Trigger className={trigger()} {...railProps}>
        <Avatar
          name={name ?? ''}
          email={email}
          variant={
            placement === ACCOUNT_MENU_PLACEMENT.PILL ? 'chip' : 'account'
          }
        />
        {placement === ACCOUNT_MENU_PLACEMENT.PILL && (
          <span className={pillLabel()}>{roleLine}</span>
        )}
        {placement === ACCOUNT_MENU_PLACEMENT.FOOT && (
          <>
            <span className={meta()}>
              <span className={nameLine()} title={displayName}>
                {displayName}
              </span>
              {hasEmailLine && <span className={emailLine()}>{email}</span>}
            </span>
            <Icon name={ICONS.CHEVRON_UP} className={chevron()} />
          </>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner {...POSITIONER_PROPS[placement]}>
          <Menu.Popup
            aria-label={t('menuLabel')}
            className={surfacePopup({ class: popup() })}
          >
            <div className={header()}>
              <span className={headerName()}>{displayName}</span>
              {hasEmailLine && <span className={headerEmail()}>{email}</span>}
              <span className={headerRole()}>{roleLine}</span>
            </div>
            <Menu.Item
              ref={signOutRef}
              className={item()}
              onClick={handleSignOut}
            >
              <Icon name={ICONS.POWER} className={signOutIcon()} />
              {t('signOut')}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
