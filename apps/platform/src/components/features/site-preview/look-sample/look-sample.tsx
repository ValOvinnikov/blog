import { LookSampleActions } from '@platform/components/features/site-preview/look-sample/components/look-sample-actions/look-sample-actions';
import { LookSampleBand } from '@platform/components/features/site-preview/look-sample/components/look-sample-band/look-sample-band';
import { LookSampleBanner } from '@platform/components/features/site-preview/look-sample/components/look-sample-banner/look-sample-banner';
import { LookSampleCta } from '@platform/components/features/site-preview/look-sample/components/look-sample-cta/look-sample-cta';
import { LookSampleFaq } from '@platform/components/features/site-preview/look-sample/components/look-sample-faq/look-sample-faq';
import { LookSampleForm } from '@platform/components/features/site-preview/look-sample/components/look-sample-form/look-sample-form';
import { LookSamplePosts } from '@platform/components/features/site-preview/look-sample/components/look-sample-posts/look-sample-posts';
import { LookSampleQuote } from '@platform/components/features/site-preview/look-sample/components/look-sample-quote/look-sample-quote';
import { SampleBusyButton } from '@platform/components/features/site-preview/sample-busy-button';
import { SampleSiteFooter } from '@platform/components/features/site-preview/sample-site-footer';
import {
  SampleSiteHeader,
  type TSampleSiteHeaderProps,
} from '@platform/components/features/site-preview/sample-site-header';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import type { TSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import {
  type IBusyStyle,
  SKIN_REGISTRY,
  TEXT_ROLE,
  type TLocaleIsoCode,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { objectKeys } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { lookSampleVariants } from './look-sample-variants';

export type TLookSampleHeaderState = Pick<TSampleSiteHeaderProps, 'reader'> &
  Partial<
    Pick<
      TSampleSiteHeaderProps,
      'isSubmenuOpen' | 'shouldAlwaysShowLanguageSwitcher'
    >
  >;

export type TLookSampleProps = {
  brand: TSampleSiteHeaderProps['brand'];
  theme: TSitePreviewTheme;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  footer: TSampleFooterStyle;
  busy: IBusyStyle;
  headerState: TLookSampleHeaderState;
};

export const LookSample = ({
  brand,
  theme,
  liveLocales,
  header,
  footer,
  busy,
  headerState: {
    reader,
    isSubmenuOpen = false,
    shouldAlwaysShowLanguageSwitcher = false,
  },
}: TLookSampleProps) => {
  const t = useTranslations('lookPreview');

  const { root, main, hero, divider } = lookSampleVariants();

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
        reader={reader}
        isDark={theme.isDark}
        isSubmenuOpen={isSubmenuOpen}
        shouldAlwaysShowLanguageSwitcher={shouldAlwaysShowLanguageSwitcher}
      />
      <div className={main()}>
        <div className={hero()}>
          <Heading level={1} visual={TEXT_ROLE.SECTION_TITLE}>
            {t('sampleHeading')}
          </Heading>
          <Text textRole={TEXT_ROLE.CARD_BODY}>{t('samplePara')}</Text>
          <LookSampleActions>
            <SampleBusyButton busy={busy} />
          </LookSampleActions>
        </div>
        <LookSamplePosts />
        <hr className={divider()} />
        <LookSampleFaq />
        <LookSampleForm />
        <LookSampleQuote />
        <LookSampleCta />
      </div>
      {objectKeys(SKIN_REGISTRY).map((skin) => (
        <LookSampleBand key={skin} skin={skin} />
      ))}
      <LookSampleBanner />
      <SampleSiteFooter brand={brand} footer={footer} />
    </SiteThemeFrame>
  );
};
