import { type IWithClassName, type IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { PricingCardActions } from './components/actions/pricing-card-actions';
import { PricingCardBadge } from './components/badge/pricing-card-badge';
import { PricingCardDescription } from './components/description/pricing-card-description';
import { PricingCardExtra } from './components/extra/pricing-card-extra';
import { PricingCardFeatures } from './components/features/pricing-card-features';
import { PricingCardFootnote } from './components/footnote/pricing-card-footnote';
import { PricingCardName } from './components/name/pricing-card-name';
import { PricingCardPrice } from './components/price/pricing-card-price';
import { pricingCardVariants } from './pricing-card-variants';

const PricingCardParts = {
  Badge: PricingCardBadge,
  Name: PricingCardName,
  Description: PricingCardDescription,
  Price: PricingCardPrice,
  Extra: PricingCardExtra,
  Features: PricingCardFeatures,
  Actions: PricingCardActions,
  Footnote: PricingCardFootnote,
} satisfies Record<string, ElementType>;

export type TPricingCardProps = IWithClassName &
  IWithDataTestId & {
    isHighlighted?: boolean;
    children?: TCompoundChildren<typeof PricingCardParts>;
  };

/** A single pricing tier: headline price, extra price lines, a feature checklist, actions and small print, optionally raised with a badge and an accent border. */
const PricingCardRoot = ({
  isHighlighted = false,
  children,
  className,
  dataTestId,
}: TPricingCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PricingCardParts);
  const {
    Badge,
    Name,
    Description,
    Price,
    Extra,
    Features,
    Actions,
    Footnote,
  } = slots;
  const s = pricingCardVariants({ isHighlighted });

  return (
    <article className={s.root({ class: className })} data-testid={dataTestId}>
      {isHighlighted && Badge && <div className={s.highlight()}>{Badge}</div>}
      {Name && <div className={s.name()}>{Name}</div>}
      {Description && <div className={s.description()}>{Description}</div>}
      {Price && <div className={s.price()}>{Price}</div>}
      {(Extra || unmatched.length > 0) && (
        <div className={s.extras()}>
          {Extra}
          {unmatched.map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </div>
      )}
      {Features && <div className={s.features()}>{Features}</div>}
      {Actions && <div className={s.actions()}>{Actions}</div>}
      {Footnote && <div className={s.footnote()}>{Footnote}</div>}
    </article>
  );
};

export const PricingCard: TCompoundComponent<
  typeof PricingCardRoot,
  typeof PricingCardParts
> = Object.assign(PricingCardRoot, PricingCardParts);
