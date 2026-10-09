import {
  SIZE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/look-sample/components/sample-language-switcher';
import { useTranslations } from 'next-intl';

import { sampleSiteHeaderVariants } from './sample-site-header-variants';

export type TSampleSiteHeaderProps = {
  tenantName: string;
  logoSrc: string | undefined;
  headingFontFamily: string;
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
};

export const SampleSiteHeader = ({
  tenantName,
  logoSrc,
  headingFontFamily,
  liveLocales,
  languageSwitcherStyle,
}: TSampleSiteHeaderProps) => {
  const t = useTranslations('lookPreview');
  const { root, brand, brandName, nav } = sampleSiteHeaderVariants();

  return (
    <header className={root()}>
      <div className={brand()}>
        <BrandMark size={SIZE.SM} title={tenantName} src={logoSrc} />
        <span className={brandName()} style={{ fontFamily: headingFontFamily }}>
          {tenantName}
        </span>
      </div>
      <div className={nav()}>
        <NavLink href="#" isActive={true}>
          {t('navPosts')}
        </NavLink>
        <NavLink href="#">{t('navAbout')}</NavLink>
        <SampleLanguageSwitcher
          liveLocales={liveLocales}
          switcherStyle={languageSwitcherStyle}
        />
      </div>
    </header>
  );
};
