import { type IBusyStyle, SIZE, type TLocaleIsoCode } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { LookSampleCta } from '@platform/components/features/site-preview/look-sample/components/look-sample-cta/look-sample-cta';
import { LookSampleFaq } from '@platform/components/features/site-preview/look-sample/components/look-sample-faq/look-sample-faq';
import { LookSampleForm } from '@platform/components/features/site-preview/look-sample/components/look-sample-form/look-sample-form';
import { LookSamplePosts } from '@platform/components/features/site-preview/look-sample/components/look-sample-posts/look-sample-posts';
import { LookSampleQuote } from '@platform/components/features/site-preview/look-sample/components/look-sample-quote/look-sample-quote';
import { SampleBusyButton } from '@platform/components/features/site-preview/sample-busy-button';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SampleSiteFooter } from '@platform/components/features/site-preview/sample-site-footer';
import {
  SampleSiteHeader,
  type TSampleSiteHeaderProps,
} from '@platform/components/features/site-preview/sample-site-header';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import { SAMPLE_PART } from '@platform/constants/sample-part';
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
  isSubmenuOpen?: boolean;
  shouldAlwaysShowLanguageSwitcher?: boolean;
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
  isSubmenuOpen = false,
  shouldAlwaysShowLanguageSwitcher = false,
}: TLookSampleProps) => {
  const t = useTranslations('lookPreview');

  const { root, main, hero, title, lead, actionsRow } = lookSampleVariants();

  return (
    <SiteThemeFrame
      theme={theme}
      className={root()}
      testId={LOOK_SAMPLE_TOKENS_TEST_ID}
    >
      <SampleSiteHeader
        brand={brand}
        liveLocales={liveLocales}
        header={header}
        hasReaderAccounts={hasReaderAccounts}
        isSignedIn={isSignedIn}
        isDark={theme.isDark}
        isSubmenuOpen={isSubmenuOpen}
        isEdgeToEdge={true}
        shouldAlwaysShowLanguageSwitcher={shouldAlwaysShowLanguageSwitcher}
      />
      <div className={main()}>
        <div className={hero()}>
          <Heading level={1} visual="preview" className={title()}>
            {t('sampleHeading')}
          </Heading>
          <Text variant="supporting" className={lead()}>
            {t('samplePara')}
          </Text>
          <div className={actionsRow()}>
            <SamplePart part={SAMPLE_PART.ACTION_BUTTON}>
              <Button type="button" size={SIZE.SM}>
                {t('subscribeButton')}
              </Button>
            </SamplePart>
            <SamplePart part={SAMPLE_PART.ACTION_BUTTON}>
              <Button type="button" variant="ghost" size={SIZE.SM}>
                {t('readMoreButton')}
              </Button>
            </SamplePart>
            <SampleBusyButton busy={busy} />
          </div>
        </div>
        <LookSamplePosts />
        <LookSampleFaq />
        <LookSampleForm />
        <LookSampleQuote />
        <LookSampleCta />
      </div>
      <SampleSiteFooter brand={brand} footer={footer} />
    </SiteThemeFrame>
  );
};
