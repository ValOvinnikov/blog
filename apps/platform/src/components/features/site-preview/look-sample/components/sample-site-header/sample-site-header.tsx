import {
  SIZE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/look-sample/components/sample-language-switcher';
import { useTranslations } from 'next-intl';

import { sampleSiteHeaderVariants } from './sample-site-header-variants';

export type TSampleSiteHeaderProps = {
  tenantName: string;
  logoSrc: string | undefined;
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
};

export const SampleSiteHeader = ({
  tenantName,
  logoSrc,
  liveLocales,
  languageSwitcherStyle,
}: TSampleSiteHeaderProps) => {
  const t = useTranslations('lookPreview');
  const { root, brand, brandName, nav } = sampleSiteHeaderVariants();

  return (
    <header className={root()}>
      <div className={brand()}>
        <BrandMark size={SIZE.SM} title={tenantName} src={logoSrc} />
        <span className={brandName()}>{tenantName}</span>
      </div>
      <div className={nav()}>
        <TextLink appearance="nav" href="#" isCurrent={true}>
          {t('navPosts')}
        </TextLink>
        <TextLink appearance="nav" href="#">
          {t('navAbout')}
        </TextLink>
        <SampleLanguageSwitcher
          liveLocales={liveLocales}
          switcherStyle={languageSwitcherStyle}
        />
      </div>
    </header>
  );
};
