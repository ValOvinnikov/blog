import { faker } from '@faker-js/faker';

import { isUuid } from './is-uuid';

describe(isUuid, () => {
  it('accepts a UUID', () => {
    expect(isUuid(faker.string.uuid())).toBe(true);
  });

  it('rejects an id that is not a UUID', () => {
    expect(isUuid(`admin-virtual:${faker.string.uuid()}`)).toBe(false);
  });
});
