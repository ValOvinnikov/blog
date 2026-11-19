import { SAMPLE_LINK_HREF } from '@platform/constants/sample-link';
import type { IAccountControl, TAccountButtonStyle } from '@shinefold/config';
import { AccountPanel } from '@shinefold/ui/components/molecules/account-panel';
import { AccountTrigger } from '@shinefold/ui/components/molecules/account-trigger';
import { PopoverMenu } from '@shinefold/ui/components/molecules/popover-menu';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { sampleAccountControlVariants } from './sample-account-control-variants';

export type TSampleAccountControlProps = {
  account: IAccountControl;
  appearance: TAccountButtonStyle;
  isSignedIn: boolean;
};

export const SampleAccountControl = ({
  account: { panelStyle },
  appearance,
  isSignedIn,
}: TSampleAccountControlProps) => {
  const t = useTranslations('lookPreview');
  const panelId = useId();
  const { trigger, panel } = sampleAccountControlVariants({ appearance });

  const user = isSignedIn ? { name: t('sampleReaderName') } : undefined;

  return (
    <PopoverMenu>
      <AccountTrigger
        appearance={appearance}
        className={trigger()}
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
