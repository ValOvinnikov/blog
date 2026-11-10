'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ICONS, SIZE, type TAccountPanelStyle } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import {
  ReaderAccountPanel,
  useReaderAccount,
} from '@web/components/shared/reader-account-panel';
import { ReaderSignInPanel } from '@web/components/shared/reader-sign-in-panel';
import { SESSION_STATUS } from '@web/constants/session';
import { useOverlayOpenState } from '@web/hooks/use-overlay-open-state';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';

import { accountMenuGroupVariants } from './account-menu-group-variants';

export type TAccountMenuGroupProps = {
  oauthProviderIds: readonly TOAuthProviderId[];
  panelStyle: TAccountPanelStyle;
  hasBookmarks: boolean;
  groupName: string;
};

export const AccountMenuGroup = ({
  oauthProviderIds,
  panelStyle,
  hasBookmarks,
  groupName,
}: TAccountMenuGroupProps) => {
  const { status, user, onImageError } = useReaderAccount();
  const t = useTranslations('authMenu');
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useOverlayOpenState({
    overlayId: panelId,
  });
  const { group, row, glyph, chevron, panel } = accountMenuGroupVariants();
  const panelState = { panelId, open: isExpanded, panelRef };

  if (status === SESSION_STATUS.LOADING) {
    return null;
  }

  return (
    <details
      name={groupName}
      open={isExpanded}
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
          hasBookmarks={hasBookmarks}
          panel={panelState}
          className={panel()}
        />
      ) : (
        <ReaderSignInPanel
          panel={panelState}
          oauthProviderIds={oauthProviderIds}
          className={panel()}
        />
      )}
    </details>
  );
};
