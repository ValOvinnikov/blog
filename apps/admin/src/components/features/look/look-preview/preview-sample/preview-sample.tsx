import { Size } from '@blog/config';
import { BrandMark } from '@blog/ui/atoms/brand-mark';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { previewSampleVariants } from './preview-sample-variants';

export type TPreviewSampleProps = {
  tenantSlug: string;
  tokenStyle: CSSProperties;
  isDark: boolean;
  headingFontFamily: string;
  bodyFontFamily: string;
  isChromeOn: boolean;
};

/**
 * The simulated tenant site — the only piece of the Look tab that renders
 * with the tenant's own theme, through real `@blog/ui` primitives, so the
 * preview shows what the site will actually look like rather than an
 * admin-styled approximation of it.
 */
export const PreviewSample = ({
  tenantSlug,
  tokenStyle,
  isDark,
  headingFontFamily,
  bodyFontFamily,
  isChromeOn,
}: TPreviewSampleProps) => {
  const t = useTranslations('lookPreview');

  const { previewBox, previewSurface, brandRow, brandName, actionsRow, chip } =
    previewSampleVariants({ isDark });

  const sample = (
    <>
      <div className={brandRow()}>
        <BrandMark size={Size.SM} title={tenantSlug} />
        <span className={brandName()} style={{ fontFamily: headingFontFamily }}>
          {tenantSlug}
        </span>
      </div>
      <Heading
        level={3}
        visual="preview"
        style={{ fontFamily: headingFontFamily }}
      >
        {t('sampleHeading')}
      </Heading>
      <Text variant="supporting" style={{ fontFamily: bodyFontFamily }}>
        {t('samplePara')}
      </Text>
      <div className={actionsRow()}>
        <Button type="button" size={Size.SM}>
          {t('subscribeButton')}
        </Button>
        <Button type="button" variant="ghost" size={Size.SM}>
          {t('readMoreButton')}
        </Button>
        <span className={chip()}>{t('readTimeChip')}</span>
      </div>
    </>
  );

  return (
    <div style={tokenStyle}>
      {isChromeOn ? (
        <WindowChrome className={previewSurface()}>
          <WindowChrome.Bar>
            <WindowChrome.Prompt>{t('terminalPrompt')}</WindowChrome.Prompt>
          </WindowChrome.Bar>
          <WindowChrome.Body>{sample}</WindowChrome.Body>
        </WindowChrome>
      ) : (
        <div className={previewBox()}>{sample}</div>
      )}
    </div>
  );
};
