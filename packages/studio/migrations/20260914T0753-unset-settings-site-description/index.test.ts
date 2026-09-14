import { at, unset } from 'sanity/migrate';

import { removeStaleDescription } from './index';

describe(removeStaleDescription, () => {
  it('unsets description when it is present', () => {
    const result = removeStaleDescription({
      description: 'A blog about software craftsmanship.',
    });

    expect(result).toEqual([at('description', unset())]);
  });

  it('is idempotent — a doc with no description is left alone', () => {
    const result = removeStaleDescription({});

    expect(result).toBeUndefined();
  });
});
