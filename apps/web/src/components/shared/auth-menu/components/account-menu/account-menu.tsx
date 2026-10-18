'use client';

import { ICONS, routes, SIZE, type TMaybeNull } from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { Icon } from '@blog/ui/components/atoms/icon';
import { Text } from '@blog/ui/components/atoms/text';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { SmartLink } from '@web/components/shared/smart-link';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, type RefObject } from 'react';

import { accountMenuVariants } from './account-menu-variants';

export type TAccountMenuProps = {
  panelId: string;
  isOpen: boolean;
  toggle: () => void;
  triggerRef: RefObject<TMaybeNull<HTMLButtonElement>>;
  panelRef: RefObject<TMaybeNull<HTMLDivElement>>;
  name?: TMaybeNull<string>;
  email?: TMaybeNull<string>;
  image?: TMaybeNull<string>;
};

/**
 * The title is a plain styled label, not a heading — `role="menu"` doesn't
 * own heading elements per the ARIA menu pattern, and this panel renders
 * ahead of every page's own `<h1>` in `[tenant]/[locale]/layout.tsx`.
 */
export const AccountMenu = ({
  panelId,
  isOpen,
  toggle,
  triggerRef,
  panelRef,
  name,
  email,
  image,
}: TAccountMenuProps) => {
  const t = useTranslations('authMenu');
  const { panel, avatarFrame, avatar } = authMenuVariants();
  const { menuRoot, label, acctRow, accountName, accountEmail, signOutItem } =
    accountMenuVariants();

  const displayName = name ?? email ?? '';

  const [lastImage, setLastImage] = useState(image);
  const [imageFailed, setImageFailed] = useState(false);
  if (image !== lastImage) {
    setLastImage(image);
    setImageFailed(false);
  }
  const avatarSrc = imageFailed ? undefined : (image ?? undefined);

  return (
    <PopoverMenu className={menuRoot()}>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={t('accountMenuAriaLabel')}
        isOpen={isOpen}
        panelId={panelId}
        onClick={toggle}
        variant="avatar"
        className={avatarFrame()}
      >
        <Avatar
          src={avatarSrc}
          name={displayName}
          alt=""
          size={SIZE.MD}
          className={avatar()}
          onImageError={() => setImageFailed(true)}
        />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        isOpen={isOpen}
        ariaLabel={t('accountMenuAriaLabel')}
        className={panel()}
      >
        <Text variant="emphasis" className={label()}>
          {t('accountHeading')}
        </Text>
        <div className={acctRow()}>
          <Avatar
            src={avatarSrc}
            name={displayName}
            alt=""
            size={SIZE.SM}
            onImageError={() => setImageFailed(true)}
          />
          <div>
            <p className={accountName()}>{displayName}</p>
            {email && <p className={accountEmail()}>{email}</p>}
          </div>
        </div>
        <PopoverMenu.Item
          as={SmartLink}
          href={routes.bookmarks()}
          icon={<Icon name={ICONS.BOOKMARK} size={SIZE.SM} />}
        >
          {t('myBookmarks')}
        </PopoverMenu.Item>
        <PopoverMenu.Item
          as={SmartLink}
          href={routes.account()}
          icon={<Icon name={ICONS.SETTINGS} size={SIZE.SM} />}
        >
          {t('accountSettings')}
        </PopoverMenu.Item>
        <PopoverMenu.Item
          onClick={() => signOut()}
          className={signOutItem()}
          icon={<Icon name={ICONS.POWER} size={SIZE.SM} />}
        >
          {t('signOut')}
        </PopoverMenu.Item>
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
};
