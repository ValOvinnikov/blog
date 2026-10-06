export interface IFormatPriceAmountArgs {
  amount: number;
  locale: string;
  currency: string;
  freeLabel: string;
}

export const formatPriceAmount = ({
  amount,
  locale,
  currency,
  freeLabel,
}: IFormatPriceAmountArgs): string =>
  amount === 0
    ? freeLabel
    : new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        trailingZeroDisplay: 'stripIfInteger',
      }).format(amount);
