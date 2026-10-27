import { mockReference } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';
import { at, patch, set } from 'sanity/migrate';

import { collectRefRewritePatches, rewriteRefsDeep } from './rewrite-refs';

faker.seed(18);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_PAGE_POST_ID = faker.string.uuid();
const MOCK_OTHER_POST_ID = faker.string.uuid();
const MOCK_OTHER_PAGE_POST_ID = faker.string.uuid();
const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_PERSON_ID = faker.string.uuid();
const MOCK_DOC_ID = faker.string.uuid();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_ITEM_KEY = faker.string.uuid();
const MOCK_OTHER_ITEM_KEY = faker.string.uuid();

const idMap = new Map([[MOCK_POST_ID, MOCK_PAGE_POST_ID]]);

const mockPortableText = (ref: string) => [
  {
    _type: 'block',
    _key: MOCK_BLOCK_KEY,
    markDefs: [
      {
        _type: 'link',
        _key: MOCK_MARK_KEY,
        internalReference: mockReference(ref),
      },
    ],
    children: [],
  },
];

describe(rewriteRefsDeep, () => {
  it('rewrites a top-level reference found in the id map', () => {
    expect(rewriteRefsDeep(mockReference(MOCK_POST_ID), idMap)).toEqual(
      mockReference(MOCK_PAGE_POST_ID),
    );
  });

  it('leaves references absent from the id map unchanged', () => {
    expect(rewriteRefsDeep(mockReference(MOCK_AUTHOR_ID), idMap)).toEqual(
      mockReference(MOCK_AUTHOR_ID),
    );
  });

  it('rewrites a reference nested inside a Portable Text markDef', () => {
    expect(rewriteRefsDeep(mockPortableText(MOCK_POST_ID), idMap)).toEqual(
      mockPortableText(MOCK_PAGE_POST_ID),
    );
  });

  it.each([faker.lorem.word(), faker.number.int(), undefined])(
    'leaves the primitive %s unchanged',
    (value) => {
      expect(rewriteRefsDeep(value, idMap)).toBe(value);
    },
  );
});

describe(collectRefRewritePatches, () => {
  it('returns undefined when no ref in the document matches the id map', () => {
    const doc = {
      _id: MOCK_DOC_ID,
      _type: 'module_hero',
      title: faker.lorem.words(),
    };

    expect(collectRefRewritePatches(doc, idMap)).toBeUndefined();
  });

  it('rewrites a top-level reference field', () => {
    const doc = {
      _id: MOCK_DOC_ID,
      _type: 'module_hero',
      featuredPost: mockReference(MOCK_POST_ID),
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch(MOCK_DOC_ID, [
        at(['featuredPost', '_ref'], set(MOCK_PAGE_POST_ID)),
      ]),
    );
  });

  it('rewrites a reference nested inside a Portable Text markDef', () => {
    const doc = {
      _id: MOCK_DOC_ID,
      _type: 'module_cta',
      content: mockPortableText(MOCK_POST_ID),
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch(MOCK_DOC_ID, [
        at(
          [
            'content',
            { _key: MOCK_BLOCK_KEY },
            'markDefs',
            { _key: MOCK_MARK_KEY },
            'internalReference',
            '_ref',
          ],
          set(MOCK_PAGE_POST_ID),
        ),
      ]),
    );
  });

  it('returns undefined when a reference already points at its mapped id', () => {
    const doc = {
      _id: MOCK_DOC_ID,
      _type: 'page_post',
      author: mockReference(MOCK_PAGE_POST_ID),
    };

    expect(collectRefRewritePatches(doc, idMap)).toBeUndefined();
  });

  it('rewrites every matching reference across distinct top-level fields', () => {
    const fieldsIdMap = new Map([
      [MOCK_POST_ID, MOCK_PAGE_POST_ID],
      [MOCK_AUTHOR_ID, MOCK_PERSON_ID],
    ]);
    const doc = {
      _id: MOCK_DOC_ID,
      _type: 'module_postFeatured',
      relatedPost: mockReference(MOCK_POST_ID),
      author: mockReference(MOCK_AUTHOR_ID),
    };

    expect(collectRefRewritePatches(doc, fieldsIdMap)).toEqual(
      patch(MOCK_DOC_ID, [
        at(['relatedPost', '_ref'], set(MOCK_PAGE_POST_ID)),
        at(['author', '_ref'], set(MOCK_PERSON_ID)),
      ]),
    );
  });

  it('rewrites every matching reference in an array field', () => {
    const arrayIdMap = new Map([
      [MOCK_POST_ID, MOCK_PAGE_POST_ID],
      [MOCK_OTHER_POST_ID, MOCK_OTHER_PAGE_POST_ID],
    ]);
    const doc = {
      _id: MOCK_DOC_ID,
      _type: 'module_postFeatured',
      posts: [
        { ...mockReference(MOCK_POST_ID), _key: MOCK_ITEM_KEY },
        { ...mockReference(MOCK_OTHER_POST_ID), _key: MOCK_OTHER_ITEM_KEY },
      ],
    };

    expect(collectRefRewritePatches(doc, arrayIdMap)).toEqual(
      patch(MOCK_DOC_ID, [
        at(['posts', { _key: MOCK_ITEM_KEY }, '_ref'], set(MOCK_PAGE_POST_ID)),
        at(
          ['posts', { _key: MOCK_OTHER_ITEM_KEY }, '_ref'],
          set(MOCK_OTHER_PAGE_POST_ID),
        ),
      ]),
    );
  });
});
