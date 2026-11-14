import type { TPricingModule } from '@blog/service';
import { Text } from '@blog/ui/components/atoms/text';
import { PricingCardGrid } from '@blog/ui/components/organisms/pricing-card-grid';
import { hasArrayGotMultipleItems, hasLength } from '@blog/utils/primitives';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type ISectionProps } from '@web/components/shared/section';
import { PromotionCodeProvider } from '@web/context/promotion-code-provider';
import { LinkedPricingTierCard } from '@web/modules/pricing/components/linked-pricing-tier-card/linked-pricing-tier-card';
import { PricingPeriodSwitch } from '@web/modules/pricing/components/pricing-period-switch/pricing-period-switch';
import { PricingTierCard } from '@web/modules/pricing/components/pricing-tier-card/pricing-tier-card';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import type { IPricingPanel } from '@web/utils/to-pricing-panels';

import { pricingModuleViewVariants } from './pricing-module-view-variants';

export interface IPricingModuleViewProps extends Pick<
  TPricingModule,
  'headingBlock' | 'footnote' | 'ctaButtons' | 'contentAlignment'
> {
  section: Pick<ISectionProps, 'brandVariant' | 'layout' | 'appearance'>;
  panels: IPricingPanel[];
  titleId: string;
  dataTestId: string;
}

const TIER_COUNTS = [1, 2, 3, 4] as const;

export const PricingModuleView = ({
  section,
  headingBlock,
  panels,
  footnote,
  ctaButtons,
  contentAlignment,
  titleId,
  dataTestId,
}: IPricingModuleViewProps) => {
  const { brandVariant, layout, appearance } = section;
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const tierCount = panels[0]?.cards.length ?? 0;
  const columns = TIER_COUNTS.find((value) => value === tierCount);
  const v = pricingModuleViewVariants({ align: contentAlignment });

  const renderCards = (panel: IPricingPanel) => (
    <PricingCardGrid columns={columns}>
      {panel.cards.map((card) =>
        card.livePrice ? (
          <LinkedPricingTierCard
            key={card.id}
            card={card}
            livePrice={card.livePrice}
          />
        ) : (
          <PricingTierCard key={card.id} card={card} />
        ),
      )}
    </PricingCardGrid>
  );

  const switchPanels = panels.flatMap((panel) =>
    panel.period ? [{ period: panel.period, content: renderCards(panel) }] : [],
  );
  const [singlePanel] = panels;
  const hasLivePrice = panels.some((panel) =>
    panel.cards.some((card) => card.livePrice),
  );
  const tiers = hasArrayGotMultipleItems(switchPanels) ? (
    <PricingPeriodSwitch panels={switchPanels} align={contentAlignment} />
  ) : (
    singlePanel && renderCards(singlePanel)
  );

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      appearance={appearance}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
        variant="section"
      />
      {hasLivePrice ? (
        <PromotionCodeProvider>{tiers}</PromotionCodeProvider>
      ) : (
        tiers
      )}
      {footnote && (
        <Text variant="footnote" className={v.footnote()}>
          {footnote}
        </Text>
      )}
      {hasLength(ctaButtons) && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
