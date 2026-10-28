import { SIZE, type TLocaleIsoCode, type TMaybeUndefined } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { Panel } from '@blog/ui/components/molecules/panel';
import { SampleSiteHeader } from '@platform/components/features/site-preview/look-sample/components/sample-site-header';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const lookSampleVariants = tv({
  slots: {
    root: ['flex flex-col gap-3'],
    actionsRow: ['flex flex-wrap items-center gap-2 pt-1'],
    chip: [
      'inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-text-muted',
    ],
    // The preview frame stands in for the viewport, so 40rem mirrors the site's `sm`.
    cards: ['grid grid-cols-1 gap-3 pt-1 @[40rem]:grid-cols-2'],
    outlinedCard: ['@[40rem]:col-span-2'],
  },
});

export type TLookSampleProps = {
  tenantName: string;
  logoSrc: TMaybeUndefined<string>;
  theme: TSitePreviewTheme;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  hasReaderAccounts: boolean;
  isNarrow?: boolean;
};

export const LookSample = ({
  tenantName,
  logoSrc,
  theme,
  liveLocales,
  header,
  hasReaderAccounts,
  isNarrow = false,
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
        header={header}
        hasReaderAccounts={hasReaderAccounts}
        isNarrow={isNarrow}
        isDark={theme.isDark}
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
