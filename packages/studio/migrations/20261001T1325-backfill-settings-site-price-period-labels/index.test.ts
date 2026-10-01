import { at, setIfMissing } from 'sanity/migrate';

import { backfillPricePeriodLabels } from './index';

describe(backfillPricePeriodLabels, () => {
  it('fills every label on a document that never had the object', () => {
    const result = backfillPricePeriodLabels({});

    expect(result).toEqual([
      at('pricePeriodLabels', setIfMissing({})),
      at('pricePeriodLabels.oneTime', setIfMissing('one-time')),
      at('pricePeriodLabels.hour', setIfMissing('per hour')),
      at('pricePeriodLabels.session', setIfMissing('per session')),
      at('pricePeriodLabels.month', setIfMissing('per month')),
      at('pricePeriodLabels.year', setIfMissing('per year')),
    ]);
  });

  it('completes a partial object without touching the labels already set', () => {
    const result = backfillPricePeriodLabels({
      pricePeriodLabels: {
        oneTime: 'once',
        hour: '/hr',
        session: 'per session',
        month: '/mo',
      },
    });

    expect(result).toEqual([
      at('pricePeriodLabels', setIfMissing({})),
      at('pricePeriodLabels.year', setIfMissing('per year')),
    ]);
  });

  it('is a no-op when every label is already set', () => {
    const result = backfillPricePeriodLabels({
      pricePeriodLabels: {
        oneTime: 'once',
        hour: '/hr',
        session: '/session',
        month: '/mo',
        year: '/yr',
      },
    });

    expect(result).toBeUndefined();
  });
});
