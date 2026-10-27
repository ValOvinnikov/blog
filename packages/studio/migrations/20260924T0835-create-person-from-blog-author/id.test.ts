import { faker } from '@faker-js/faker';

import { toPersonId } from './id';

faker.seed(8351);

const MOCK_AUTHOR_ID = faker.string.uuid();

describe(toPersonId, () => {
  it('prefixes a published blog_author id', () => {
    expect(toPersonId(MOCK_AUTHOR_ID)).toBe(`person-${MOCK_AUTHOR_ID}`);
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toPersonId(`drafts.${MOCK_AUTHOR_ID}`)).toBe(
      `drafts.person-${MOCK_AUTHOR_ID}`,
    );
  });

  it('leaves an already-migrated id unchanged', () => {
    const personId = `person-${MOCK_AUTHOR_ID}`;

    expect(toPersonId(personId)).toBe(personId);
  });
});
