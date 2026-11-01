'use client';

import type { TLocaleIsoCode } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import {
  PREVIEW_READER_STATE,
  PREVIEW_WIDTH,
  type TPreviewReaderState,
  type TPreviewWidth,
} from '@platform/constants/preview';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import { toSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type TLookPreviewProps = {
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
};

export const LookPreview = ({
  liveLocales,
  hasReaderAccounts,
}: TLookPreviewProps) => {
  const { tenantName, values, isSubmenuPreviewOpen } = useLookForm();
  const t = useTranslations('lookPreview');
  const tPreview = useTranslations('previewModeControl');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const [width, setWidth] = useState<TPreviewWidth>(PREVIEW_WIDTH.DESKTOP);
  const [readerState, setReaderState] = useState<TPreviewReaderState>(
    PREVIEW_READER_STATE.SIGNED_OUT,
  );
  const isNarrow = width === PREVIEW_WIDTH.MOBILE;

  const widthOptions: { value: TPreviewWidth; label: string }[] = [
    { value: PREVIEW_WIDTH.DESKTOP, label: t('widthDesktop') },
    { value: PREVIEW_WIDTH.MOBILE, label: t('widthMobile') },
  ];

  const readerStateOptions: { value: TPreviewReaderState; label: string }[] = [
    { value: PREVIEW_READER_STATE.SIGNED_OUT, label: t('readerSignedOut') },
    { value: PREVIEW_READER_STATE.SIGNED_IN, label: t('readerSignedIn') },
  ];

  return (
    <PreviewFrame
      ariaLabel={tPreview('livePreviewHeading')}
      isNarrow={isNarrow}
      widthControl={
        // Below 27.5rem the stage leaves the frame no wider than its 390px mobile width.
        <SegmentedControl
          aria={{ label: t('previewWidthAriaLabel') }}
          className="@max-[27.5rem]:hidden"
          options={widthOptions}
          value={width}
          onChange={setWidth}
        />
      }
      controls={
        <>
          <PreviewModeControl value={mode} onChange={setMode} />
          {hasReaderAccounts && (
            <SegmentedControl
              aria={{ label: t('readerStateAriaLabel') }}
              options={readerStateOptions}
              value={readerState}
              onChange={setReaderState}
            />
          )}
        </>
      }
      notes={<p>{t('previewNote')}</p>}
    >
      <LookSample
        brand={{ name: tenantName, logoSrc: values.logo.url }}
        theme={buildSitePreviewTheme(values, isDark)}
        liveLocales={liveLocales}
        header={toSampleHeaderStyle(values)}
        footer={toSampleFooterStyle(values)}
        busy={toSampleBusyStyle(values)}
        hasReaderAccounts={hasReaderAccounts}
        isSignedIn={readerState === PREVIEW_READER_STATE.SIGNED_IN}
        isNarrow={isNarrow}
        isSubmenuOpen={isSubmenuPreviewOpen}
      />
    </PreviewFrame>
  );
};
