import type { TPricingModule } from '@blog/service';
import { Text } from '@blog/ui/components/atoms/text';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { PricingPeriodSwitch } from '@web/modules/pricing/components/pricing-period-switch/pricing-period-switch';
import { PricingTierCard } from '@web/modules/pricing/components/pricing-tier-card/pricing-tier-card';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import type { IPricingPanel } from '@web/utils/to-pricing-panels';

import { pricingModuleViewVariants } from './pricing-module-view-variants';

export interface IPricingModuleViewProps extends Omit<TPricingModule, 'tiers'> {
  panels: IPricingPanel[];
  titleId: string;
  dataTestId: string;
}

const TIER_COUNTS = [1, 2, 3, 4] as const;

export const PricingModuleView = ({
  brandVariant,
  headingBlock,
  panels,
  footnote,
  ctaButtons,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: IPricingModuleViewProps) => {
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const tierCount = panels[0]?.cards.length ?? 0;
  const count = TIER_COUNTS.find((value) => value === tierCount);
  const v = pricingModuleViewVariants({ count, align: contentAlignment });

  const renderCards = (panel: IPricingPanel) => (
    <div className={v.grid()}>
      {panel.cards.map((card) => (
        <PricingTierCard key={card.id} card={card} />
      ))}
    </div>
  );

  const switchPanels = panels.flatMap((panel) =>
    panel.period ? [{ period: panel.period, content: renderCards(panel) }] : [],
  );
  const [singlePanel] = panels;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
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
      {switchPanels.length > 1 ? (
        <PricingPeriodSwitch panels={switchPanels} align={contentAlignment} />
      ) : (
        singlePanel && renderCards(singlePanel)
      )}
      {footnote && (
        <Text variant="footnote" className={v.footnote()}>
          {footnote}
        </Text>
      )}
      {ctaButtons.length > 0 && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
