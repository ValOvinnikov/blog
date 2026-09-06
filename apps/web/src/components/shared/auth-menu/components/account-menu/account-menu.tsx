'use client';

import { ICONS, routes, SIZE } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Icon } from '@blog/ui/atoms/icon';
import { Text } from '@blog/ui/atoms/text';
import { PopoverMenu } from '@blog/ui/molecules/popover-menu';
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
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * `AuthMenu`'s logged-in render branch: an `Avatar`-triggered `PopoverMenu`
 * showing the session's name/email, "My bookmarks", "Account settings", and
 * "Sign out". The title is a plain styled label, not a heading —
 * `role="menu"` doesn't own heading elements per the ARIA menu pattern, and
 * this panel renders ahead of every page's own `<h1>` in
 * `[tenant]/[locale]/layout.tsx`. Open/close state and refs come from the
 * parent's single `usePopover()` call — this component never calls
 * `usePopover()` itself.
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
  const { panel, window: windowSize } = authMenuVariants();
  const {
    menuRoot,
    avatarTrigger,
    label,
    acctRow,
    accountName,
    accountEmail,
    signOutItem,
  } = accountMenuVariants();

  const displayName = name ?? email ?? '';

  // Tracks a runtime `<img>` load failure (e.g. a stale/broken OAuth avatar
  // URL) so both `Avatar` renders below fall back to initials together —
  // they show the same underlying image, so one shared flag is correct.
  // Reset whenever `image` itself changes, so a failure recorded against a
  // previous session's URL never incorrectly persists against a new one —
  // done during render (comparing against the last-seen `image`) rather than
  // in a `useEffect`, per React's "adjusting state when a prop changes"
  // guidance: an effect here would still commit the stale-initials render
  // first, then re-render a second time to clear it.
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
        className={avatarTrigger()}
      >
        <Avatar
          src={avatarSrc}
          name={displayName}
          alt=""
          size={SIZE.SM}
          onImageError={() => setImageFailed(true)}
        />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        isOpen={isOpen}
        ariaLabel={t('accountMenuAriaLabel')}
        className={`${panel()} ${windowSize()}`}
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
