import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { removeStaleTagline } from './index';

faker.seed(6018);

const MOCK_TAGLINE = faker.lorem.words();

describe(removeStaleTagline, () => {
  it('unsets tagline when it is present', () => {
    const result = removeStaleTagline({ tagline: MOCK_TAGLINE });

    expect(result).toEqual([at('tagline', unset())]);
  });

  it('leaves a doc with no tagline alone', () => {
    const result = removeStaleTagline({});

    expect(result).toBeUndefined();
  });
});
