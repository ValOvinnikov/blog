import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type IAccountControl,
} from '@blog/config';
import { AccountPanel } from '@blog/ui/components/molecules/account-panel';
import { AccountTrigger } from '@blog/ui/components/molecules/account-trigger';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { sampleAccountControlVariants } from './sample-account-control-variants';

const SAMPLE_LINK_HREF = '#';

export type TSampleAccountControlProps = {
  account: IAccountControl;
  isSignedIn: boolean;
  isNarrow: boolean;
};

export const SampleAccountControl = ({
  account: { buttonStyle, panelStyle, phonePlacement },
  isSignedIn,
  isNarrow,
}: TSampleAccountControlProps) => {
  const t = useTranslations('lookPreview');
  const panelId = useId();
  const { panel } = sampleAccountControlVariants();

  if (isNarrow && phonePlacement === ACCOUNT_PHONE_PLACEMENT.MENU) {
    return null;
  }

  const user = isSignedIn ? { name: t('sampleReaderName') } : undefined;

  return (
    <PopoverMenu>
      <AccountTrigger
        appearance={isNarrow ? ACCOUNT_BUTTON_STYLE.CIRCLE : buttonStyle}
        labels={{ signIn: t('signIn'), account: t('accountHeading') }}
        user={user}
        isOpen={isSignedIn}
        panelId={panelId}
      />
      {user && (
        <AccountPanel
          appearance={panelStyle}
          user={user}
          className={panel()}
          panel={{
            id: panelId,
            isOpen: true,
            ariaLabel: t('accountMenuAriaLabel'),
          }}
          links={{
            bookmarks: {
              href: SAMPLE_LINK_HREF,
              label: t('myBookmarks'),
              description: t('myBookmarksDescription'),
            },
            settings: {
              href: SAMPLE_LINK_HREF,
              label: t('accountSettings'),
              description: t('accountSettingsDescription'),
            },
          }}
          signOut={{ label: t('signOut'), onClick: () => undefined }}
        />
      )}
    </PopoverMenu>
  );
};
