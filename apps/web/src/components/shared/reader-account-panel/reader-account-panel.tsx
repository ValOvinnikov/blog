'use client';

import {
  routes,
  type IWithClassName,
  type TAccountPanelStyle,
} from '@blog/config';
import { AccountPanel } from '@blog/ui/components/molecules/account-panel';
import { SmartLink } from '@web/components/shared/smart-link';
import type { TPopoverPanel } from '@web/hooks/use-popover';
import { encodeClearedSignedInHint } from '@web/utils/signed-in-hint-cookie';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export interface IReaderAccountUser {
  name: string;
  email?: string;
  image?: string;
}

export type TReaderAccountPanelProps = IWithClassName & {
  appearance: TAccountPanelStyle;
  user: IReaderAccountUser;
  onImageError: () => void;
  hasBookmarks: boolean;
  panel: TPopoverPanel;
};

export const ReaderAccountPanel = ({
  appearance,
  user,
  onImageError,
  hasBookmarks,
  panel,
  className,
}: TReaderAccountPanelProps) => {
  const t = useTranslations('authMenu');
  const { panelId, open, panelRef } = panel;

  return (
    <AccountPanel
      ref={panelRef}
      appearance={appearance}
      user={user}
      onImageError={onImageError}
      linkAs={SmartLink}
      className={className}
      panel={{
        id: panelId,
        isOpen: open,
        ariaLabel: t('accountMenuAriaLabel'),
      }}
      links={{
        ...(hasBookmarks && {
          bookmarks: {
            href: routes.bookmarks(),
            label: t('myBookmarks'),
            description: t('myBookmarksDescription'),
          },
        }),
        settings: {
          href: routes.account(),
          label: t('accountSettings'),
          description: t('accountSettingsDescription'),
        },
      }}
      signOut={{
        label: t('signOut'),
        onClick: () => {
          document.cookie = encodeClearedSignedInHint();
          void signOut();
        },
      }}
    />
  );
};
