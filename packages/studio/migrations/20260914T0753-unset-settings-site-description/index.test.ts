import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { removeStaleDescription } from './index';

faker.seed(6018);

const MOCK_DESCRIPTION = faker.lorem.sentence();

describe(removeStaleDescription, () => {
  it('unsets description when it is present', () => {
    const result = removeStaleDescription({ description: MOCK_DESCRIPTION });

    expect(result).toEqual([at('description', unset())]);
  });

  it('leaves a doc with no description alone', () => {
    const result = removeStaleDescription({});

    expect(result).toBeUndefined();
  });
});
