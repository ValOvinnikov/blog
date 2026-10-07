import { SIZE } from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { Panel } from '@blog/ui/components/molecules/panel';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import { previewSampleVariants } from './preview-sample-variants';

export type TPreviewSampleProps = {
  tenantName: string;
  logoSrc: string | undefined;
  tokenStyle: CSSProperties;
  isDark: boolean;
  headingFontFamily: string;
  bodyFontFamily: string;
};

export const PreviewSample = ({
  tenantName,
  logoSrc,
  tokenStyle,
  isDark,
  headingFontFamily,
  bodyFontFamily,
}: TPreviewSampleProps) => {
  const t = useTranslations('lookPreview');

  const { root, brandRow, brandName, actionsRow, chip, cards, outlinedCard } =
    previewSampleVariants({ isDark });

  return (
    <div
      className={root()}
      style={tokenStyle}
      data-testid="preview-sample-tokens"
    >
      <div className={brandRow()}>
        <BrandMark size={SIZE.SM} title={tenantName} src={logoSrc} />
        <span className={brandName()} style={{ fontFamily: headingFontFamily }}>
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
      <div className={cards()}>
        <MediaCard isInteractive={false} excerpt={t('firstCardExcerpt')}>
          <MediaCard.Title level={4}>{t('firstCardTitle')}</MediaCard.Title>
        </MediaCard>
        <MediaCard isInteractive={false} excerpt={t('secondCardExcerpt')}>
          <MediaCard.Title level={4}>{t('secondCardTitle')}</MediaCard.Title>
        </MediaCard>
        <Panel className={outlinedCard()}>
          <Panel.Header headingLevel={4}>
            {t('outlinedCardHeading')}
          </Panel.Header>
          <Panel.Body>
            <Text variant="supporting" style={{ fontFamily: bodyFontFamily }}>
              {t('outlinedCardBody')}
            </Text>
          </Panel.Body>
        </Panel>
      </div>
    </div>
  );
};
