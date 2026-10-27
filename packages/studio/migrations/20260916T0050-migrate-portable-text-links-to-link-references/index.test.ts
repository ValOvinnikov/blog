import { LINK_TYPE, PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import {
  isCreateIfNotExistsMutation,
  isPatchMutation,
} from '@blog/studio/testing/migrations/mutation-guards';
import {
  MOCK_EXTERNAL_LABEL,
  MOCK_EXTERNAL_URL,
  mockInlineLinkMarkDef,
  mockLinkRefMarkDef,
  mockPagePost,
  mockPortableTextBlock,
  mockRawHrefMarkDef,
  mockSpan,
} from '@blog/studio/testing/migrations/portable-text-links';
import { faker } from '@faker-js/faker';
import type { SanityDocument } from 'sanity';
import {
  at,
  createIfNotExists,
  patch,
  set,
  type NodePatch,
  type Path,
} from 'sanity/migrate';
import type { MockInstance } from 'vitest';

import migration from './index';

faker.seed(6019);

const MOCK_CONTENT_FIELD = 'content';
const MARK_DEFS_FIELD = 'markDefs';
const CHILDREN_FIELD = 'children';

const migrate = async (
  document: SanityDocument,
  dataset: unknown[] = [],
): Promise<unknown[]> =>
  (await runDocumentMigration(
    migration,
    document,
    mockMigrationContext(dataset),
  )) as unknown[];

const toBlockPath = (blockKey: string, field: string): Path => [
  MOCK_CONTENT_FIELD,
  { _key: blockKey },
  field,
];

const toLinkRefMarkDef = (key: string, linkId: string) => ({
  _key: key,
  _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
  link: { _type: 'reference', _ref: linkId },
});

const getCreatedLinkId = (mutations: unknown[]): string => {
  const createMutation = mutations.find(isCreateIfNotExistsMutation);

  if (!createMutation)
    throw new Error('Expected a createIfNotExists mutation.');

  return createMutation.document._id;
};

describe('migrate-portable-text-links-to-link-references', () => {
  let warnSpy: MockInstance;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each([
    {
      name: 'has no Portable Text field',
      content: undefined,
    },
    {
      name: 'has blocks carrying no markDefs',
      content: [mockPortableTextBlock()],
    },
    {
      name: 'is already migrated to linkRef',
      content: [
        mockPortableTextBlock({
          markDefs: [mockLinkRefMarkDef(faker.string.uuid())],
        }),
      ],
    },
  ])('leaves a document alone when it $name', async ({ content }) => {
    const document = mockMigrationDocument({
      _type: 'page_post',
      [MOCK_CONTENT_FIELD]: content,
    });

    const mutations = await migrate(document);

    expect(mutations).toEqual([]);
  });

  describe('with a /blog/<slug> href', () => {
    const post = mockPagePost();
    const markDef = mockRawHrefMarkDef(`/blog/${post.slug.current}`);
    const span = mockSpan(faker.lorem.words(2), [markDef._key]);
    const block = mockPortableTextBlock({
      markDefs: [markDef],
      children: [span],
    });
    const document = mockMigrationDocument({
      _type: 'page_post',
      [MOCK_CONTENT_FIELD]: [block],
    });

    it('seeds an internal link document and points the markDef at it', async () => {
      const mutations = await migrate(document, [post]);

      const linkId = getCreatedLinkId(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: 'link',
          title: `Link to ${post.title}`,
          label: post.title,
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _type: 'reference', _ref: post._id },
        }),
        patch(document._id, [
          at(
            toBlockPath(block._key, MARK_DEFS_FIELD),
            set([toLinkRefMarkDef(markDef._key, linkId)]),
          ),
          at(toBlockPath(block._key, CHILDREN_FIELD), set([span])),
        ]),
      ]);
    });

    it('warns about the link document it seeds', async () => {
      const mutations = await migrate(document, [post]);

      const linkId = getCreatedLinkId(mutations);

      expect(warnSpy).toHaveBeenCalledWith(
        `Seeding link "${linkId}" — label: "${post.title}", title: "Link to ${post.title}".`,
      );
    });

    it('strips the link when no post has that slug', async () => {
      const mutations = await migrate(document);

      expect(mutations).toEqual([
        patch(document._id, [
          at(toBlockPath(block._key, MARK_DEFS_FIELD), set([])),
          at(
            toBlockPath(block._key, CHILDREN_FIELD),
            set([{ ...span, marks: [] }]),
          ),
        ]),
      ]);
    });

    it('warns about the link it strips', async () => {
      await migrate(document);

      expect(warnSpy).toHaveBeenCalledWith(
        `${document._id}: stripped a link with no resolvable destination (/blog/${post.slug.current}) — left as plain text.`,
      );
    });

    it('seeds one link document for two blocks sharing the destination', async () => {
      const secondMarkDef = mockRawHrefMarkDef(`/blog/${post.slug.current}`);
      const secondSpan = mockSpan(faker.lorem.words(2), [secondMarkDef._key]);
      const secondBlock = mockPortableTextBlock({
        markDefs: [secondMarkDef],
        children: [secondSpan],
      });
      const twoBlockDocument = mockMigrationDocument({
        _type: 'page_post',
        [MOCK_CONTENT_FIELD]: [block, secondBlock],
      });

      const mutations = await migrate(twoBlockDocument, [post]);

      const linkId = getCreatedLinkId(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: 'link',
          title: `Link to ${post.title}`,
          label: post.title,
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _type: 'reference', _ref: post._id },
        }),
        patch(twoBlockDocument._id, [
          at(
            toBlockPath(block._key, MARK_DEFS_FIELD),
            set([toLinkRefMarkDef(markDef._key, linkId)]),
          ),
          at(toBlockPath(block._key, CHILDREN_FIELD), set([span])),
          at(
            toBlockPath(secondBlock._key, MARK_DEFS_FIELD),
            set([toLinkRefMarkDef(secondMarkDef._key, linkId)]),
          ),
          at(toBlockPath(secondBlock._key, CHILDREN_FIELD), set([secondSpan])),
        ]),
      ]);
    });
  });

  describe('with an external href', () => {
    it('seeds an external link document', async () => {
      const markDef = mockRawHrefMarkDef(MOCK_EXTERNAL_URL);
      const document = mockMigrationDocument({
        _type: 'page_post',
        [MOCK_CONTENT_FIELD]: [
          mockPortableTextBlock({
            markDefs: [markDef],
            children: [mockSpan(faker.lorem.word(), [markDef._key])],
          }),
        ],
      });

      const mutations = await migrate(document);

      const linkId = getCreatedLinkId(mutations);
      const [createMutation] = mutations;

      expect(createMutation).toEqual(
        createIfNotExists({
          _id: linkId,
          _type: 'link',
          title: `Link to ${MOCK_EXTERNAL_URL}`,
          label: MOCK_EXTERNAL_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_EXTERNAL_URL,
        }),
      );
    });
  });

  describe('with a structured inlineLink markDef', () => {
    it('seeds a link document carrying the markDef label', async () => {
      const label = faker.lorem.words(2);
      const markDef = mockInlineLinkMarkDef({
        label,
        linkType: LINK_TYPE.EXTERNAL,
        url: MOCK_EXTERNAL_URL,
      });
      const document = mockMigrationDocument({
        _type: 'module_cta',
        [MOCK_CONTENT_FIELD]: [
          mockPortableTextBlock({
            markDefs: [markDef],
            children: [mockSpan(faker.lorem.word(), [markDef._key])],
          }),
        ],
      });

      const mutations = await migrate(document);

      const linkId = getCreatedLinkId(mutations);
      const [createMutation] = mutations;

      expect(createMutation).toEqual(
        createIfNotExists({
          _id: linkId,
          _type: 'link',
          title: `Link to ${MOCK_EXTERNAL_URL}`,
          label,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_EXTERNAL_URL,
        }),
      );
    });
  });

  describe('with a block nested inside an aside object', () => {
    it('patches the nested block at its full path', async () => {
      const markDef = mockRawHrefMarkDef(MOCK_EXTERNAL_URL);
      const block = mockPortableTextBlock({
        markDefs: [markDef],
        children: [mockSpan(faker.lorem.word(), [markDef._key])],
      });
      const asideKey = faker.string.alphanumeric(12);
      const document = mockMigrationDocument({
        _type: 'page_post',
        [MOCK_CONTENT_FIELD]: [
          {
            _key: asideKey,
            _type: 'aside',
            kind: faker.lorem.word(),
            body: [block],
          },
        ],
      });

      const mutations = await migrate(document);

      const patchMutation = mutations.find(isPatchMutation);
      const paths = patchMutation?.patches.map(
        (nodePatch: NodePatch) => nodePatch.path,
      );

      expect(paths).toEqual([
        [
          MOCK_CONTENT_FIELD,
          { _key: asideKey },
          'body',
          { _key: block._key },
          MARK_DEFS_FIELD,
        ],
        [
          MOCK_CONTENT_FIELD,
          { _key: asideKey },
          'body',
          { _key: block._key },
          CHILDREN_FIELD,
        ],
      ]);
    });
  });
});
