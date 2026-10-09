'use client';

import { Menu } from '@base-ui/react/menu';
import { Avatar } from '@platform/components/shared/avatar';
import { signOutAction } from '@platform/server/auth/sign-out-action';
import { useTranslations } from 'next-intl';
import { startTransition } from 'react';

import { accountMenuVariants } from './account-menu-variants';

export type TAccountMenuProps = {
  name: string | undefined;
  label: string;
};

export const AccountMenu = ({ name, label }: TAccountMenuProps) => {
  const t = useTranslations('account');
  const { trigger, dot, text, popup, item } = accountMenuVariants();

  const handleSignOut = () => {
    startTransition(() => signOutAction());
  };

  return (
    <Menu.Root>
      <Menu.Trigger className={trigger()}>
        <Avatar name={name ?? ''} variant="chip" />
        <span aria-hidden="true" className={dot()} />
        <span className={text()}>{label}</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end">
          <Menu.Popup className={popup()}>
            <Menu.Item className={item()} onClick={handleSignOut}>
              {t('signOut')}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
