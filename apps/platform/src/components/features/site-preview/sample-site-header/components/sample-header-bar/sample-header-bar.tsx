import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  ICONS,
  SIZE,
  type IAccountControl,
  type TMaybeUndefined,
} from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { SampleHeaderBrand } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-brand/sample-header-brand';
import { SampleAccountControl } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-account-control/sample-account-control';
import { SAMPLE_HEADER_BAR_TEST_ID } from '@platform/constants/sample-header';
import { useTranslations } from 'next-intl';

import { sampleHeaderBarVariants } from './sample-header-bar-variants';

export type TSampleHeaderBarProps = IWithClassName & {
  brand: { name: string; logoSrc: TMaybeUndefined<string> };
  account: IAccountControl;
  hasReaderAccounts: boolean;
  isSignedIn: boolean;
  isBrandLarge: boolean;
};

export const SampleHeaderBar = ({
  brand: { name, logoSrc },
  account,
  hasReaderAccounts,
  isSignedIn,
  isBrandLarge,
  className,
}: TSampleHeaderBarProps) => {
  const t = useTranslations('lookPreview');
  const { root, controls, menuButton } = sampleHeaderBarVariants();
  const menuLabel = t('menuButton');
  const hasAccount =
    hasReaderAccounts &&
    account.phonePlacement !== ACCOUNT_PHONE_PLACEMENT.MENU;

  return (
    <div
      className={root({ class: className })}
      data-testid={SAMPLE_HEADER_BAR_TEST_ID}
    >
      <SampleHeaderBrand
        name={name}
        logoSrc={logoSrc}
        isCompact={true}
        isLarge={isBrandLarge}
      />
      <div className={controls()}>
        {hasAccount && (
          <SampleAccountControl
            account={account}
            appearance={ACCOUNT_BUTTON_STYLE.CIRCLE}
            isSignedIn={isSignedIn}
          />
        )}
        <IconButton
          variant="circle"
          ariaLabel={menuLabel}
          title={menuLabel}
          className={menuButton()}
        >
          <Icon name={ICONS.MENU} size={SIZE.MD} />
        </IconButton>
      </div>
    </div>
  );
};
