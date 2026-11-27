import { BrandCard } from '@platform/components/features/look/look-form/components/brand-card';
import { ColourCard } from '@platform/components/features/look/look-form/components/colour-card';
import { DetailsCard } from '@platform/components/features/look/look-form/components/details-card';
import { FooterCard } from '@platform/components/features/look/look-form/components/footer-card';
import { HeaderCard } from '@platform/components/features/look/look-form/components/header-card';
import { PresetCard } from '@platform/components/features/look/look-form/components/preset-card';
import { ShapeCard } from '@platform/components/features/look/look-form/components/shape-card';
import { TypeCard } from '@platform/components/features/look/look-form/components/type-card';
import type { TLookRowsAccordion } from '@platform/components/features/look/look-form/use-look-open-rows';
import { LookGrowthNote } from '@platform/components/features/look/look-growth-note';
import { Accordion } from '@platform/components/shared/accordion';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';

import { lookEditCardsVariants } from './look-edit-cards-variants';

export type TLookEditCardsProps = {
  rows: TLookRowsAccordion;
  hasCookieBanner: boolean;
  hasMultipleLanguages: boolean;
  hasGrowthNote: boolean;
  onSelectCard: (card: TLookCard) => void;
  summaries: Record<TLookRow, string>;
};

export const LookEditCards = ({
  rows: { openValues, onOpenValuesChange, actionsRef },
  hasCookieBanner,
  hasMultipleLanguages,
  hasGrowthNote,
  onSelectCard,
  summaries,
}: TLookEditCardsProps) => (
  <>
    {hasGrowthNote && <LookGrowthNote onSelectCard={onSelectCard} />}
    <PresetCard />
    <Accordion<TLookRow>
      multiple={true}
      variant={ACCORDION_VARIANT.ROW}
      isList={true}
      openValues={openValues}
      onOpenValuesChange={onOpenValuesChange}
      actionsRef={actionsRef}
      className={lookEditCardsVariants()}
    >
      <BrandCard summary={summaries[LOOK_ROW.BRAND]} />
      <ColourCard summary={summaries[LOOK_ROW.COLOUR]} />
      <TypeCard summary={summaries[LOOK_ROW.TYPE]} />
      <ShapeCard summary={summaries[LOOK_ROW.SHAPE]} />
      <HeaderCard
        hasMultipleLanguages={hasMultipleLanguages}
        summary={summaries[LOOK_ROW.HEADER]}
      />
      <FooterCard summary={summaries[LOOK_ROW.FOOTER]} />
      <DetailsCard
        hasCookieBanner={hasCookieBanner}
        summary={summaries[LOOK_ROW.DETAILS]}
      />
    </Accordion>
  </>
);
