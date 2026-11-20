'use client';

import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import type { TSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { TLocaleIsoCode } from '@shinefold/config';

export type TLookPreviewSampleProps = {
  theme: TSitePreviewTheme;
  footer: TSampleFooterStyle;
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
  hasBookmarks: boolean;
  isSignedIn: boolean;
};

export const LookPreviewSample = ({
  theme,
  footer,
  liveLocales,
  hasReaderAccounts,
  hasBookmarks,
  isSignedIn,
}: TLookPreviewSampleProps) => {
  const { shownBrandName, values, isSubmenuPreviewOpen } = useLookForm();

  return (
    <LookSample
      brand={{ name: shownBrandName, logoSrc: values.logo.url }}
      theme={theme}
      liveLocales={liveLocales}
      header={toSampleHeaderStyle(values)}
      footer={footer}
      busy={toSampleBusyStyle(values)}
      headerState={{
        hasReaderAccounts,
        hasBookmarks,
        isSignedIn,
        isSubmenuOpen: isSubmenuPreviewOpen,
      }}
    />
  );
};
