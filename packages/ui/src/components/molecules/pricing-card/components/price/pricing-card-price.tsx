import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { pricingCardPriceVariants } from './pricing-card-price-variants';

export type TPricingCardPriceProps = IWithClassName &
  IWithDataTestId & {
    amount: string;
    compareAt?: string;
    period?: string;
    prefix?: string;
  };

const s = pricingCardPriceVariants();

/** A `PricingCard`'s headline price, taking pre-formatted strings and never formatting currency or numbers itself. A `compareAt` value renders struck through with a screen-reader-only "Regular price" prefix, so it's announced as the regular price rather than read as a second, unexplained figure. */
export const PricingCardPrice = ({
  amount,
  compareAt,
  period,
  prefix,
  className,
  dataTestId,
}: TPricingCardPriceProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    {prefix && <span className={s.prefix()}>{prefix}</span>}
    <div className={s.headline()}>
      <span className={s.amount()}>{amount}</span>
      {period && <span className={s.period()}>/{period}</span>}
    </div>
    {compareAt && (
      <span>
        <span className={s.compareAtLabel()}>Regular price </span>
        <span className={s.compareAtValue()}>{compareAt}</span>
      </span>
    )}
  </div>
);
