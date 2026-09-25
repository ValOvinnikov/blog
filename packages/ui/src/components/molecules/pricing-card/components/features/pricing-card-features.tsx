import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';

import { pricingCardFeaturesVariants } from './pricing-card-features-variants';

export type TPricingCardFeaturesProps = IWithClassName &
  IWithDataTestId & {
    items: string[];
  };

const s = pricingCardFeaturesVariants();

/** The checklist of what a `PricingCard`'s tier includes; grows to fill the card's remaining height so `Actions` lines up across neighbouring cards. Each check icon is decorative and stays hidden from assistive tech. */
export const PricingCardFeatures = ({
  items,
  className,
  dataTestId,
}: TPricingCardFeaturesProps) => (
  <ul className={s.root({ class: className })} data-testid={dataTestId}>
    {items.map((item) => (
      <li key={item} className={s.item()}>
        <Icon name={ICONS.CHECK} size={SIZE.SM} className={s.icon()} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
