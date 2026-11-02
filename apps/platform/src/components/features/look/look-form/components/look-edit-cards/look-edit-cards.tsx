import { BrandCard } from '@platform/components/features/look/look-form/components/brand-card';
import { ButtonsCard } from '@platform/components/features/look/look-form/components/buttons-card';
import { ColourCard } from '@platform/components/features/look/look-form/components/colour-card';
import { FooterCard } from '@platform/components/features/look/look-form/components/footer-card';
import { HeaderCard } from '@platform/components/features/look/look-form/components/header-card';
import { LanguageSwitcherCard } from '@platform/components/features/look/look-form/components/language-switcher-card';
import { LookGroup } from '@platform/components/features/look/look-form/components/look-group';
import { PresetCard } from '@platform/components/features/look/look-form/components/preset-card';
import { ShapeCard } from '@platform/components/features/look/look-form/components/shape-card';
import { TypeCard } from '@platform/components/features/look/look-form/components/type-card';
import type { TLookRowsGroup } from '@platform/components/features/look/look-form/use-look-open-rows';
import { useTranslations } from 'next-intl';

export type TLookEditCardsProps = {
  styleGroup: TLookRowsGroup;
  sitePartsGroup: TLookRowsGroup;
  hasCookieBanner: boolean;
  hasMultipleLanguages: boolean;
};

export const LookEditCards = ({
  styleGroup,
  sitePartsGroup,
  hasCookieBanner,
  hasMultipleLanguages,
}: TLookEditCardsProps) => {
  const t = useTranslations('lookForm');

  return (
    <>
      <PresetCard />
      <LookGroup title={t('styleGroupHeading')} group={styleGroup}>
        <ColourCard />
        <BrandCard />
        <TypeCard />
        <ShapeCard />
        <ButtonsCard />
      </LookGroup>
      <LookGroup title={t('sitePartsGroupHeading')} group={sitePartsGroup}>
        <HeaderCard />
        <FooterCard hasCookieBanner={hasCookieBanner} />
        <LanguageSwitcherCard hasMultipleLanguages={hasMultipleLanguages} />
      </LookGroup>
    </>
  );
};
