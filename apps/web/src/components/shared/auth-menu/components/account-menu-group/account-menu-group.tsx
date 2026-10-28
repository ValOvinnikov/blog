'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ICONS, SIZE, type TAccountPanelStyle } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { ReaderAccountPanel } from '@web/components/shared/auth-menu/components/reader-account-panel/reader-account-panel';
import { ReaderSignInPanel } from '@web/components/shared/auth-menu/components/reader-sign-in-panel/reader-sign-in-panel';
import { useReaderAccount } from '@web/components/shared/auth-menu/hooks/use-reader-account';
import { SESSION_STATUS } from '@web/constants/session';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { accountMenuGroupVariants } from './account-menu-group-variants';

export type TAccountMenuGroupProps = {
  oauthProviderIds: readonly TOAuthProviderId[];
  panelStyle: TAccountPanelStyle;
  groupName: string;
};

export const AccountMenuGroup = ({
  oauthProviderIds,
  panelStyle,
  groupName,
}: TAccountMenuGroupProps) => {
  const { status, user, onImageError } = useReaderAccount();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { group, row, glyph, chevron, panel } = accountMenuGroupVariants();

  if (status === SESSION_STATUS.LOADING) {
    return null;
  }

  return (
    <details
      name={groupName}
      onToggle={(event) => setIsExpanded(event.currentTarget.open)}
      className={group()}
    >
      <summary className={row()}>
        <Icon name={ICONS.USER} size={SIZE.SM} className={glyph()} />
        {user ? t('accountHeading') : t('signIn')}
        <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} className={chevron()} />
      </summary>
      {user ? (
        <ReaderAccountPanel
          appearance={panelStyle}
          user={user}
          onImageError={onImageError}
          panelId={panelId}
          isOpen={isExpanded}
          panelRef={panelRef}
          className={panel()}
        />
      ) : (
        <ReaderSignInPanel
          panelId={panelId}
          isOpen={isExpanded}
          panelRef={panelRef}
          oauthProviderIds={oauthProviderIds}
          className={panel()}
        />
      )}
    </details>
  );
};
