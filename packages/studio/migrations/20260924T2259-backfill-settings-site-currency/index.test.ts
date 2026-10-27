import { at, set } from 'sanity/migrate';

import { backfillSiteCurrency } from './index';

const MOCK_DEFAULT_CURRENCY = 'USD';
const MOCK_OTHER_CURRENCY = 'GBP';

describe(backfillSiteCurrency, () => {
  it('sets the default currency on a document that never had the field', () => {
    const result = backfillSiteCurrency({});

    expect(result).toEqual([at('currency', set(MOCK_DEFAULT_CURRENCY))]);
  });

  it.each([MOCK_DEFAULT_CURRENCY, MOCK_OTHER_CURRENCY])(
    'leaves a document that already has currency %s alone',
    (currency) => {
      const result = backfillSiteCurrency({ currency });

      expect(result).toBeUndefined();
    },
  );
});
