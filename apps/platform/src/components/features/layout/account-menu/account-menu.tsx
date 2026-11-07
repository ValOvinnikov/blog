'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS, type TMaybeUndefined } from '@blog/config';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Avatar } from '@platform/components/shared/avatar';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { NestableMenuRoot } from '@platform/components/shared/nestable-menu-root';
import { NestableMenuTrigger } from '@platform/components/shared/nestable-menu-trigger';
import {
  ACCOUNT_MENU_PLACEMENT,
  type TAccountMenuPlacement,
} from '@platform/constants/account-menu';
import { MENU_RADIO_GROUP_SIZE } from '@platform/constants/menu-radio-group';
import { useIsNestedMenu } from '@platform/context/nested-menu-provider';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { useTranslations } from 'next-intl';
import { startTransition, useRef } from 'react';

import { accountMenuVariants } from './account-menu-variants';
import { AccountThemeSection } from './components/account-theme-section';

export type TAccount = {
  name: TMaybeUndefined<string>;
  email: TMaybeUndefined<string>;
  roleLine: string;
};

export type TAccountMenuProps = {
  account: TAccount;
};

// The rail trigger ends 12px inside the rail's edge, so 20px clears the rail by 8px.
const POSITIONER_PROPS = {
  [ACCOUNT_MENU_PLACEMENT.FOOT]: { side: 'top', align: 'start', sideOffset: 6 },
  [ACCOUNT_MENU_PLACEMENT.RAIL]: {
    side: 'right',
    align: 'end',
    sideOffset: 20,
  },
  [ACCOUNT_MENU_PLACEMENT.MENU]: { side: 'top', align: 'start', sideOffset: 6 },
} as const satisfies Record<TAccountMenuPlacement, object>;

export const AccountMenu = ({ account }: TAccountMenuProps) => {
  const t = useTranslations('account');
  const { isCollapsed } = useSidebarCollapse();
  const isNested = useIsNestedMenu();
  const signOutRef = useRef<HTMLDivElement>(null);
  const { name, email, roleLine } = account;
  const displayName = name ?? email ?? '';
  const hasEmailLine = Boolean(name && email);

  const placement: TAccountMenuPlacement = isNested
    ? ACCOUNT_MENU_PLACEMENT.MENU
    : isCollapsed
      ? ACCOUNT_MENU_PLACEMENT.RAIL
      : ACCOUNT_MENU_PLACEMENT.FOOT;
  const {
    trigger,
    meta,
    nameLine,
    emailLine,
    chevron,
    popup,
    header,
    headerName,
    headerEmail,
    headerRole,
    signOutIcon,
  } = accountMenuVariants({ placement });
  const { positioner, popup: surfacePopup, item } = menuSurfaceVariants();

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
    if (isOpen && !isNested) {
      signOutRef.current?.focus();
    }
  };

  const handleSignOut = () => {
    startTransition(() => signOutAction());
  };

  return (
    <NestableMenuRoot onOpenChangeComplete={handleOpenChangeComplete}>
      <NestableMenuTrigger className={trigger()} {...railProps}>
        <Avatar name={name ?? ''} email={email} variant="account" />
        {placement !== ACCOUNT_MENU_PLACEMENT.RAIL && (
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
      </NestableMenuTrigger>
      <Menu.Portal>
        <Menu.Positioner
          {...POSITIONER_PROPS[placement]}
          className={positioner()}
        >
          <Menu.Popup
            aria-label={t('menuLabel')}
            className={surfacePopup({ class: popup() })}
          >
            <div className={header()}>
              <span className={headerName()}>{displayName}</span>
              {hasEmailLine && <span className={headerEmail()}>{email}</span>}
              <span className={headerRole()}>{roleLine}</span>
            </div>
            <AccountThemeSection
              size={
                isNested
                  ? MENU_RADIO_GROUP_SIZE.TOUCH
                  : MENU_RADIO_GROUP_SIZE.DESKTOP
              }
            />
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
    </NestableMenuRoot>
  );
};
