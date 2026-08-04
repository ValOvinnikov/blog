'use client';

import { Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms';
import { PopoverMenu, WindowChrome } from '@blog/ui/molecules';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import type { RefObject } from 'react';

import { authMenuVariants } from '../../auth-menu-variants';
import { toSessionUsername } from '../../utils/to-session-username';

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
 * shell, showing the session's name/email and "Sign out". ("My bookmarks"
 * is deliberately not here yet — the `/bookmarks` route doesn't exist until
 * #1043 lands; add the item back alongside that route instead of linking to
 * a 404 today.) Open/close state and refs come from the parent's single
 * `usePopover()` call — this component never calls `usePopover()` itself.
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
  const {
    avatarTrigger,
    panel,
    window: windowSize,
    acctRow,
    accountName,
    accountEmail,
    signOutItem,
  } = authMenuVariants();

  const displayName = name ?? email ?? '';
  const username = toSessionUsername(name, email);

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ref={triggerRef}
        ariaLabel={t('accountMenuAriaLabel')}
        open={open}
        panelId={panelId}
        onClick={toggle}
        className={avatarTrigger()}
      >
        <Avatar
          src={image ?? undefined}
          name={displayName}
          alt=""
          size={Size.SM}
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
                src={image ?? undefined}
                name={displayName}
                alt=""
                size={Size.SM}
              />
              <div>
                <p className={accountName()}>{displayName}</p>
                {email && <p className={accountEmail()}>{email}</p>}
              </div>
            </div>
            <PopoverMenu.Item
              onClick={() => signOut()}
              className={signOutItem()}
              icon={<span aria-hidden="true">⏻</span>}
            >
              {t('signOut')}
            </PopoverMenu.Item>
          </WindowChrome.Body>
        </WindowChrome>
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
}
