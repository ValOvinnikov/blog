import { faker } from '@faker-js/faker';

import { toSectionPagesId } from './id';

faker.seed(9000);

const MOCK_CHILD_PAGES_ID = faker.string.uuid();

describe(toSectionPagesId, () => {
  it('prefixes a published module_childPages id', () => {
    expect(toSectionPagesId(MOCK_CHILD_PAGES_ID)).toBe(
      `sectionPages-${MOCK_CHILD_PAGES_ID}`,
    );
  });

  it('keeps the drafts. prefix outermost', () => {
    expect(toSectionPagesId(`drafts.${MOCK_CHILD_PAGES_ID}`)).toBe(
      `drafts.sectionPages-${MOCK_CHILD_PAGES_ID}`,
    );
  });

  it('leaves an already-migrated id unchanged', () => {
    const sectionPagesId = `sectionPages-${MOCK_CHILD_PAGES_ID}`;

    expect(toSectionPagesId(sectionPagesId)).toBe(sectionPagesId);
  });
});
