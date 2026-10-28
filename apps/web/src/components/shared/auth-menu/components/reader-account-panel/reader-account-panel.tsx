'use client';

import {
  routes,
  type IWithClassName,
  type TAccountPanelStyle,
  type TMaybeNull,
} from '@blog/config';
import { AccountPanel } from '@blog/ui/components/molecules/account-panel';
import { SmartLink } from '@web/components/shared/smart-link';
import { encodeClearedSignedInHint } from '@web/utils/signed-in-hint-cookie';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import type { RefObject } from 'react';

export interface IReaderAccountUser {
  name: string;
  email?: string;
  image?: string;
}

export type TReaderAccountPanelProps = IWithClassName & {
  appearance: TAccountPanelStyle;
  user: IReaderAccountUser;
  onImageError: () => void;
  panelId: string;
  isOpen: boolean;
  panelRef?: RefObject<TMaybeNull<HTMLDivElement>>;
};

export const ReaderAccountPanel = ({
  appearance,
  user,
  onImageError,
  panelId,
  isOpen,
  panelRef,
  className,
}: TReaderAccountPanelProps) => {
  const t = useTranslations('authMenu');

  return (
    <AccountPanel
      ref={panelRef}
      appearance={appearance}
      user={user}
      onImageError={onImageError}
      linkAs={SmartLink}
      className={className}
      panel={{ id: panelId, isOpen, ariaLabel: t('accountMenuAriaLabel') }}
      links={{
        bookmarks: {
          href: routes.bookmarks(),
          label: t('myBookmarks'),
          description: t('myBookmarksDescription'),
        },
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
