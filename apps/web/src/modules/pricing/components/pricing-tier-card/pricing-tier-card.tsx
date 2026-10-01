import { PricingCard } from '@blog/ui/components/molecules/pricing-card';
import { ActionGroup } from '@web/components/shared/action-group';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';

export interface IPricingTierCardProps {
  card: IPricingCardData;
}

export const PricingTierCard = ({ card }: IPricingTierCardProps) => {
  const {
    name,
    description,
    headline,
    label,
    extras,
    features,
    ctaButtons,
    highlightLabel,
    footnote,
  } = card;
  const priceAmount = headline?.amount ?? label;

  return (
    <PricingCard isHighlighted={highlightLabel !== undefined}>
      {[
        highlightLabel ? (
          <PricingCard.Badge key="badge">{highlightLabel}</PricingCard.Badge>
        ) : null,
        <PricingCard.Name key="name">{name}</PricingCard.Name>,
        description ? (
          <PricingCard.Description key="description">
            {description}
          </PricingCard.Description>
        ) : null,
        priceAmount ? (
          <PricingCard.Price
            key="price"
            amount={priceAmount}
            compareAt={headline?.compareAt}
            period={headline?.period}
            prefix={headline?.prefix}
          />
        ) : null,
        ...extras.map((extra) => (
          <PricingCard.Extra key={extra}>{extra}</PricingCard.Extra>
        )),
        features.length > 0 ? (
          <PricingCard.Features key="features" items={features} />
        ) : null,
        ctaButtons.length > 0 ? (
          <PricingCard.Actions key="actions">
            <ActionGroup actions={ctaButtons} />
          </PricingCard.Actions>
        ) : null,
        footnote ? (
          <PricingCard.Footnote key="footnote">{footnote}</PricingCard.Footnote>
        ) : null,
      ]}
    </PricingCard>
  );
};
