import { PricingCard } from '@shinefold/ui/components/molecules/pricing-card';
import { hasLength, isUndefined } from '@shinefold/utils/primitives';
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
  const compareAt = headline?.compareAt;

  return (
    <PricingCard isHighlighted={!isUndefined(highlightLabel)}>
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
        priceAmount && compareAt ? (
          <PricingCard.Price
            key="price"
            amount={priceAmount}
            period={headline?.period}
            prefix={headline?.prefix}
            compareAt={compareAt.amount}
            compareAtLabel={compareAt.label}
          />
        ) : null,
        priceAmount && !compareAt ? (
          <PricingCard.Price
            key="price"
            amount={priceAmount}
            period={headline?.period}
            prefix={headline?.prefix}
          />
        ) : null,
        ...extras.map((extra, index) => (
          <PricingCard.Extra key={`extra-${index}`}>{extra}</PricingCard.Extra>
        )),
        hasLength(features) ? (
          <PricingCard.Features key="features" items={features} />
        ) : null,
        hasLength(ctaButtons) ? (
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
