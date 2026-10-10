import {
  SIZE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { Panel } from '@blog/ui/components/molecules/panel';
import { SampleSiteHeader } from '@platform/components/features/site-preview/look-sample/components/sample-site-header';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';

import { lookSampleVariants } from './look-sample-variants';

export type TLookSampleProps = {
  tenantName: string;
  logoSrc: string | undefined;
  theme: TSitePreviewTheme;
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
};

export const LookSample = ({
  tenantName,
  logoSrc,
  theme,
  liveLocales,
  languageSwitcherStyle,
}: TLookSampleProps) => {
  const t = useTranslations('lookPreview');

  const { root, actionsRow, chip, cards, outlinedCard } = lookSampleVariants();

  return (
    <SiteThemeFrame
      theme={theme}
      className={root()}
      testId="look-sample-tokens"
    >
      <SampleSiteHeader
        tenantName={tenantName}
        logoSrc={logoSrc}
        liveLocales={liveLocales}
        languageSwitcherStyle={languageSwitcherStyle}
      />
      <Heading level={3} visual="preview">
        {t('sampleHeading')}
      </Heading>
      <Text variant="supporting">{t('samplePara')}</Text>
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
        <MediaCard isInteractive={true} excerpt={t('firstCardExcerpt')}>
          <MediaCard.Title level={4}>
            <MediaCard.Link href="#">{t('firstCardTitle')}</MediaCard.Link>
          </MediaCard.Title>
        </MediaCard>
        <MediaCard isInteractive={false} excerpt={t('secondCardExcerpt')}>
          <MediaCard.Title level={4}>{t('secondCardTitle')}</MediaCard.Title>
        </MediaCard>
        <Panel className={outlinedCard()}>
          <Panel.Header headingLevel={4}>
            {t('outlinedCardHeading')}
          </Panel.Header>
          <Panel.Body>
            <Text variant="supporting">{t('outlinedCardBody')}</Text>
          </Panel.Body>
        </Panel>
      </div>
    </SiteThemeFrame>
  );
};
