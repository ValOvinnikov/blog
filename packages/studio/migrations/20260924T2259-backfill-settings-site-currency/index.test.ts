import { at, set } from 'sanity/migrate';

import { backfillSiteCurrency } from './index';

describe(backfillSiteCurrency, () => {
  it('sets currency to USD on a document that never had the field', () => {
    const result = backfillSiteCurrency({});

    expect(result).toEqual([at('currency', set('USD'))]);
  });

  it('is idempotent — a document already migrated to USD is left alone', () => {
    const result = backfillSiteCurrency({ currency: 'USD' });

    expect(result).toBeUndefined();
  });

  it('is idempotent — a document with a different currency is never clobbered', () => {
    const result = backfillSiteCurrency({ currency: 'GBP' });

    expect(result).toBeUndefined();
  });
});
