'use client';

import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import type { TSampleReader } from '@platform/components/features/site-preview/sample-site-header';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import type { TSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { TLocaleIsoCode } from '@shinefold/config';

export type TLookPreviewSampleProps = {
  theme: TSitePreviewTheme;
  footer: TSampleFooterStyle;
  liveLocales: readonly TLocaleIsoCode[];
  reader: TSampleReader;
};

export const LookPreviewSample = ({
  theme,
  footer,
  liveLocales,
  reader,
}: TLookPreviewSampleProps) => {
  const { shownBrandName, values, isSubmenuPreviewOpen } = useLookForm();
  const { logo, logoDark } = values;
  const logoSrc = theme.isDark ? (logoDark.url ?? logo.url) : logo.url;

  return (
    <LookSample
      brand={{ name: shownBrandName, logoSrc }}
      theme={theme}
      liveLocales={liveLocales}
      header={toSampleHeaderStyle(values)}
      footer={footer}
      busy={toSampleBusyStyle(values)}
      headerState={{
        reader,
        isSubmenuOpen: isSubmenuPreviewOpen,
      }}
    />
  );
};
