import { type IBusyStyle, SIZE, type TLocaleIsoCode } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { Panel } from '@blog/ui/components/molecules/panel';
import { SampleBusyButton } from '@platform/components/features/site-preview/sample-busy-button';
import { SampleChip } from '@platform/components/features/site-preview/sample-chip';
import { SampleSiteFooter } from '@platform/components/features/site-preview/sample-site-footer';
import {
  SampleSiteHeader,
  type TSampleSiteHeaderProps,
} from '@platform/components/features/site-preview/sample-site-header';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import type { TSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';

import { lookSampleVariants } from './look-sample-variants';

export type TLookSampleProps = {
  brand: TSampleSiteHeaderProps['brand'];
  theme: TSitePreviewTheme;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  footer: TSampleFooterStyle;
  busy: IBusyStyle;
  hasReaderAccounts: boolean;
  isSignedIn?: boolean;
  isNarrow?: boolean;
  isSubmenuOpen?: boolean;
};

export const LookSample = ({
  brand,
  theme,
  liveLocales,
  header,
  footer,
  busy,
  hasReaderAccounts,
  isSignedIn = false,
  isNarrow = false,
  isSubmenuOpen = false,
}: TLookSampleProps) => {
  const t = useTranslations('lookPreview');

  const { root, actionsRow, cards, outlinedCard } = lookSampleVariants();

  return (
    <SiteThemeFrame
      theme={theme}
      className={root()}
      testId="look-sample-tokens"
    >
      <SampleSiteHeader
        brand={brand}
        liveLocales={liveLocales}
        header={header}
        hasReaderAccounts={hasReaderAccounts}
        isSignedIn={isSignedIn}
        isNarrow={isNarrow}
        isDark={theme.isDark}
        isSubmenuOpen={isSubmenuOpen}
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
        <SampleBusyButton busy={busy} />
        <SampleChip>{t('readTimeChip')}</SampleChip>
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
      <SampleSiteFooter brand={brand} footer={footer} />
    </SiteThemeFrame>
  );
};
