'use client';

import { ICONS, routes, Size } from '@blog/config';
import { Avatar, Icon } from '@blog/ui/atoms';
import { PopoverMenu, WindowChrome } from '@blog/ui/molecules';
import { authMenuVariants } from '@web/components/shared/auth-menu/auth-menu-variants';
import { SmartLink } from '@web/components/shared/smart-link';
import { toSessionUsername } from '@web/utils/to-session-username';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, type RefObject } from 'react';

import { accountMenuVariants } from './account-menu-variants';

export type TAccountMenuProps = {
  panelId: string;
  open: boolean;
  toggle: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * AccountMenu — `AuthMenu`'s logged-in render branch (#1107): an
 * `Avatar`-triggered `PopoverMenu` dressed in the `WindowChrome` terminal
 * shell, showing the session's name/email, "My bookmarks" (`/bookmarks`,
 * #1043/#1109), "Account settings" (`/account`, #1154), and "Sign out".
 * Open/close state and refs come from the parent's single `usePopover()`
 * call — this component never calls `usePopover()` itself.
 */
export function AccountMenu({
  panelId,
  open,
  toggle,
  triggerRef,
  panelRef,
  name,
  email,
  image,
}: TAccountMenuProps) {
  const t = useTranslations('authMenu');
  const { panel, window: windowSize } = authMenuVariants();
  const {
    menuRoot,
    avatarTrigger,
    acctRow,
    accountName,
    accountEmail,
    signOutItem,
  } = accountMenuVariants();

  const displayName = name ?? email ?? '';
  const username = toSessionUsername(name, email);

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
        open={open}
        panelId={panelId}
        onClick={toggle}
        className={avatarTrigger()}
      >
        <Avatar
          src={avatarSrc}
          name={displayName}
          alt=""
          size={Size.SM}
          onImageError={() => setImageFailed(true)}
        />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        ref={panelRef}
        id={panelId}
        open={open}
        ariaLabel={t('accountMenuAriaLabel')}
        className={panel()}
      >
        <WindowChrome className={windowSize()}>
          <WindowChrome.Bar>
            <WindowChrome.User>{username}</WindowChrome.User>{' '}
            <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
            {t('promptCommandAccount')}
          </WindowChrome.Bar>
          <WindowChrome.Body>
            <div className={acctRow()}>
              <Avatar
                src={avatarSrc}
                name={displayName}
                alt=""
                size={Size.SM}
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
              icon={<Icon name={ICONS.BOOKMARK} size={Size.SM} />}
            >
              {t('myBookmarks')}
            </PopoverMenu.Item>
            <PopoverMenu.Item
              as={SmartLink}
              href={routes.account()}
              icon={<Icon name={ICONS.SETTINGS} size={Size.SM} />}
            >
              {t('accountSettings')}
            </PopoverMenu.Item>
            <PopoverMenu.Item
              onClick={() => signOut()}
              className={signOutItem()}
              icon={<Icon name={ICONS.POWER} size={Size.SM} />}
            >
              {t('signOut')}
            </PopoverMenu.Item>
          </WindowChrome.Body>
        </WindowChrome>
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
}
