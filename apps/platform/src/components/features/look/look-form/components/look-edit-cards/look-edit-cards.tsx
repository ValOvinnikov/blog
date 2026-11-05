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
import { LOOK_GROUP } from '@platform/constants/look-group';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { useTranslations } from 'next-intl';

export type TLookEditCardsProps = {
  styleGroup: TLookRowsGroup;
  sitePartsGroup: TLookRowsGroup;
  hasCookieBanner: boolean;
  hasMultipleLanguages: boolean;
  summaries: Record<TLookRow, string>;
};

export const LookEditCards = ({
  styleGroup,
  sitePartsGroup,
  hasCookieBanner,
  hasMultipleLanguages,
  summaries,
}: TLookEditCardsProps) => {
  const t = useTranslations('lookForm');

  return (
    <>
      <PresetCard />
      <LookGroup
        anchor={LOOK_GROUP.STYLE}
        title={t('styleGroupHeading')}
        group={styleGroup}
      >
        <ColourCard summary={summaries[LOOK_ROW.COLOUR]} />
        <BrandCard summary={summaries[LOOK_ROW.BRAND]} />
        <TypeCard summary={summaries[LOOK_ROW.TYPE]} />
        <ShapeCard summary={summaries[LOOK_ROW.SHAPE]} />
        <ButtonsCard summary={summaries[LOOK_ROW.BUTTONS]} />
      </LookGroup>
      <LookGroup
        anchor={LOOK_GROUP.SITE_PARTS}
        title={t('sitePartsGroupHeading')}
        group={sitePartsGroup}
      >
        <HeaderCard summary={summaries[LOOK_ROW.HEADER]} />
        <FooterCard
          hasCookieBanner={hasCookieBanner}
          summary={summaries[LOOK_ROW.FOOTER]}
        />
        <LanguageSwitcherCard
          hasMultipleLanguages={hasMultipleLanguages}
          summary={summaries[LOOK_ROW.LANGUAGE_SWITCHER]}
        />
      </LookGroup>
    </>
  );
};
