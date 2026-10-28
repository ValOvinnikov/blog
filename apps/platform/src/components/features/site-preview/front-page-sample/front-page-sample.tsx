import { SIZE, type TLocaleIsoCode } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { SampleChip } from '@platform/components/features/site-preview/sample-chip';
import { SampleSiteHeader } from '@platform/components/features/site-preview/sample-site-header';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';

import { frontPageSampleVariants } from './front-page-sample-variants';

const POST_TITLE_KEYS = [
  'firstPostTitle',
  'secondPostTitle',
  'thirdPostTitle',
] as const;

export type TFrontPageSampleProps = {
  tenantName: string;
  theme: TSitePreviewTheme;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
};

export const FrontPageSample = ({
  tenantName,
  theme,
  liveLocales,
  header,
}: TFrontPageSampleProps) => {
  const t = useTranslations('frontPageSample');
  const tLook = useTranslations('lookPreview');
  const { root, hero, posts } = frontPageSampleVariants();

  return (
    <SiteThemeFrame
      theme={theme}
      className={root()}
      testId="front-page-sample-tokens"
    >
      <SampleSiteHeader
        brand={{ name: tenantName, logoSrc: undefined }}
        liveLocales={liveLocales}
        header={header}
        hasReaderAccounts={false}
        isNarrow={false}
        isDark={theme.isDark}
        isSubmenuOpen={false}
      />
      <div className={hero()}>
        <Heading level={3} size={SIZE.LG}>
          {t('heroHeading')}
        </Heading>
        <Text variant="hero">{t('heroText')}</Text>
        <Button type="button" size={SIZE.SM}>
          {t('heroButton')}
        </Button>
      </div>
      <div className={posts()}>
        {POST_TITLE_KEYS.map((key) => (
          <MediaCard key={key} isInteractive={false}>
            <MediaCard.Media />
            <MediaCard.Title level={4}>{t(key)}</MediaCard.Title>
            <MediaCard.Footer>
              <SampleChip>{tLook('readTimeChip')}</SampleChip>
            </MediaCard.Footer>
          </MediaCard>
        ))}
      </div>
    </SiteThemeFrame>
  );
};
