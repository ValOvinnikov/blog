import type { IAccountControl, TAccountButtonStyle } from '@blog/config';
import { AccountPanel } from '@blog/ui/components/molecules/account-panel';
import { AccountTrigger } from '@blog/ui/components/molecules/account-trigger';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { sampleAccountControlVariants } from './sample-account-control-variants';

const SAMPLE_LINK_HREF = '#';

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
