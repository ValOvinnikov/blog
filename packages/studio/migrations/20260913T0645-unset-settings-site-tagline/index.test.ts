import { at, unset } from 'sanity/migrate';

import { removeStaleTagline } from './index';

describe(removeStaleTagline, () => {
  it('unsets tagline when it is present', () => {
    const result = removeStaleTagline({ tagline: 'Field notes on software' });

    expect(result).toEqual([at('tagline', unset())]);
  });

  it('is idempotent — a doc with no tagline is left alone', () => {
    const result = removeStaleTagline({});

    expect(result).toBeUndefined();
  });
});
