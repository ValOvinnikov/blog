import { SIZE } from '@blog/config';
import { BrandMark } from '@blog/ui/atoms/brand-mark';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import { Panel } from '@blog/ui/molecules/panel';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { previewSampleVariants } from './preview-sample-variants';

export type TPreviewSampleProps = {
  tenantName: string;
  tokenStyle: CSSProperties;
  isDark: boolean;
  headingFontFamily: string;
  bodyFontFamily: string;
};

/**
 * The simulated tenant site — the only piece of the Look tab that renders
 * with the tenant's own theme, through real `@blog/ui` primitives, so the
 * preview shows what the site will actually look like rather than an
 * admin-styled approximation of it.
 */
export const PreviewSample = ({
  tenantName,
  tokenStyle,
  isDark,
  headingFontFamily,
  bodyFontFamily,
}: TPreviewSampleProps) => {
  const t = useTranslations('lookPreview');

  const { surface, brandRow, brandName, actionsRow, chip } =
    previewSampleVariants({ isDark });

  return (
    <div style={tokenStyle}>
      <Panel className={surface()} dataTestId="preview-sample-panel">
        <Panel.Body>
          <div className={brandRow()}>
            <BrandMark size={SIZE.SM} title={tenantName} />
            <span
              className={brandName()}
              style={{ fontFamily: headingFontFamily }}
            >
              {tenantName}
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
            <Button type="button" size={SIZE.SM}>
              {t('subscribeButton')}
            </Button>
            <Button type="button" variant="ghost" size={SIZE.SM}>
              {t('readMoreButton')}
            </Button>
            <span className={chip()}>{t('readTimeChip')}</span>
          </div>
        </Panel.Body>
      </Panel>
    </div>
  );
};
