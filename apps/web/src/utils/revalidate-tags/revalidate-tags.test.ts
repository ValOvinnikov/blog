import { faker } from '@faker-js/faker';

import { getRevalidateTagsForType } from './revalidate-tags';

faker.seed(6012);

const MOCK_DOCUMENT_ID = faker.string.uuid();
const MOCK_UNKNOWN_TYPE = faker.lorem.word();

describe(getRevalidateTagsForType, () => {
  it.each(['module_hero', 'module_postList', 'module_newsletter'])(
    'ends the tags of %s with the per-document tag',
    (type) => {
      const tags = getRevalidateTagsForType(type, MOCK_DOCUMENT_ID);

      expect(tags.at(-1)).toBe(`module:${MOCK_DOCUMENT_ID}`);
      expect(tags.length).toBeGreaterThan(1);
    },
  );

  it.each(['blog_topic', 'page_post', 'link'])(
    'resolves tags for %s without a per-document tag',
    (type) => {
      const tags = getRevalidateTagsForType(type, MOCK_DOCUMENT_ID);

      expect(tags.length).toBeGreaterThan(0);
      expect(tags).not.toContain(`module:${MOCK_DOCUMENT_ID}`);
    },
  );

  it('returns an empty list for an unknown type', () => {
    expect(
      getRevalidateTagsForType(MOCK_UNKNOWN_TYPE, MOCK_DOCUMENT_ID),
    ).toEqual([]);
  });

  it.each(Object.getOwnPropertyNames(Object.prototype))(
    'returns no tags for the prototype key %s',
    (type) => {
      expect(getRevalidateTagsForType(type, MOCK_DOCUMENT_ID)).toEqual([]);
    },
  );
});
