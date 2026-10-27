import {
  DISPLAY_MODE,
  LOCALE_ISO_CODES,
  POST_SOURCE,
} from '@blog/config/constants';
import { MOCK_TOPIC_ID } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_DUTCH_MODULE_HEADING,
  MOCK_ENGLISH_MODULE_HEADING,
  mockModuleDocument,
  mockRawPostFeaturedModule,
} from '@blog/service/testing/modules/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_LAUNCH_EN_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_PINNED_POST_DOCUMENTS,
  MOCK_SCHEDULED_NL_POST_ID,
  MOCK_SOLO_NL_POST_ID,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { postFeaturedModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(6014);

const MOCK_POST_FEATURED_ID = faker.string.uuid();
const MOCK_PERSON_ID = faker.string.uuid();
const MOCK_AUTHOR_NAME = faker.person.fullName();
const MOCK_TOPIC_TITLE = faker.lorem.word();
const MOCK_OLDER_EN_ID = faker.string.uuid();
const MOCK_NEWER_EN_ID = faker.string.uuid();
const MOCK_NEWER_NL_ID = faker.string.uuid();

const MOCK_MODULE_DOCUMENT = mockModuleDocument({
  _id: MOCK_POST_FEATURED_ID,
  _type: 'module_postFeatured',
  postSource: POST_SOURCE.PINNED,
  posts: [],
});

async function runPostFeatured(locale: string) {
  const raw = await evaluateGroqExpression(
    postFeaturedModuleQuery.query,
    [MOCK_MODULE_DOCUMENT],
    undefined,
    { id: MOCK_POST_FEATURED_ID, locale, defaultLocale: EN },
  );

  return postFeaturedModuleQuery.parse(raw);
}

describe('postFeaturedModuleQuery', () => {
  it('rejects a module with no headingBlock', () => {
    const raw = { ...mockRawPostFeaturedModule(), headingBlock: null };

    expect(() => postFeaturedModuleQuery.parse(raw)).toThrow();
  });

  it('defaults showImages and displayMode for a document authored without them', async () => {
    const { showImages, displayMode } = await runPostFeatured(EN);

    expect(showImages).toBe(true);
    expect(displayMode).toBe(DISPLAY_MODE.GRID);
  });

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostFeatured(NL);

    expect(headingBlock.heading).toBe(MOCK_DUTCH_MODULE_HEADING);
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostFeatured(FR);

    expect(headingBlock.heading).toBe(MOCK_ENGLISH_MODULE_HEADING);
  });

  describe('language scoping', () => {
    async function runPosts(
      module: Record<string, unknown>,
      locale: string,
    ): Promise<string[]> {
      const raw = (await evaluateGroqExpression(
        postFeaturedModuleQuery.query,
        [{ ...MOCK_MODULE_DOCUMENT, ...module }, ...MOCK_PINNED_POST_DOCUMENTS],
        undefined,
        { id: MOCK_POST_FEATURED_ID, locale, defaultLocale: EN },
      )) as { posts: unknown[] };

      return toIds(
        raw.posts.map((entry) =>
          entry && typeof entry === 'object' && 'post' in entry
            ? entry.post
            : entry,
        ),
      );
    }

    const pinned = {
      postSource: POST_SOURCE.PINNED,
      posts: [
        mockReference(MOCK_ONLY_EN_POST_ID, { _key: 'a' }),
        mockReference(MOCK_DESIGN_EN_POST_ID, { _key: 'b' }),
      ],
    };

    it('keeps pinned posts in authored order in their own language', async () => {
      expect(await runPosts(pinned, EN)).toEqual([
        MOCK_ONLY_EN_POST_ID,
        MOCK_DESIGN_EN_POST_ID,
      ]);
    });

    it('swaps a pinned post for its translation and drops one with none', async () => {
      expect(await runPosts(pinned, NL)).toEqual([MOCK_DESIGN_NL_POST_ID]);
    });

    it.each([
      [
        'keeps a pinned post with no translation group in its own language',
        MOCK_SOLO_NL_POST_ID,
        NL,
        [MOCK_SOLO_NL_POST_ID],
      ],
      [
        'drops a pinned post with no translation group in another language',
        MOCK_SOLO_NL_POST_ID,
        EN,
        [],
      ],
      [
        'drops a pinned post whose translation is scheduled',
        MOCK_LAUNCH_EN_POST_ID,
        NL,
        [],
      ],
      ['drops a pinned scheduled post', MOCK_SCHEDULED_NL_POST_ID, NL, []],
    ])('%s', async (_, ref, locale, expected) => {
      const ids = await runPosts(
        {
          postSource: POST_SOURCE.PINNED,
          posts: [mockReference(ref, { _key: 'a' })],
        },
        locale,
      );

      expect(ids).toEqual(expected);
    });

    it.each([
      [EN, [MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID]],
      [NL, [MOCK_DESIGN_NL_POST_ID]],
    ])(
      'falls back to the newest featured posts in the %s request language',
      async (locale, expected) => {
        const ids = await runPosts(
          { postSource: POST_SOURCE.NEWEST_FEATURED },
          locale,
        );

        expect(ids).toEqual(expected);
      },
    );
  });

  describe('parsed posts', () => {
    const topic = {
      _id: MOCK_TOPIC_ID,
      _type: 'blog_topic',
      title: mockLocalizedStrings({ [EN]: MOCK_TOPIC_TITLE }),
    };
    const author = {
      _id: MOCK_PERSON_ID,
      _type: 'person',
      name: MOCK_AUTHOR_NAME,
    };

    function postDocument(id: string, language: string, publishedAt: string) {
      return {
        _id: id,
        _type: 'page_post',
        language,
        featured: true,
        publishedAt,
        slug: { current: id },
        headingBlock: { _type: 'pageHeadingBlock', heading: id },
        author: mockReference(MOCK_PERSON_ID),
        topic: mockReference(MOCK_TOPIC_ID),
      };
    }

    async function runParsedPosts(module: Record<string, unknown>) {
      const raw = await evaluateGroqExpression(
        postFeaturedModuleQuery.query,
        [
          { ...MOCK_MODULE_DOCUMENT, ...module },
          topic,
          author,
          postDocument(MOCK_OLDER_EN_ID, EN, '2026-01-01T00:00:00Z'),
          postDocument(MOCK_NEWER_EN_ID, EN, '2026-01-02T00:00:00Z'),
          postDocument(MOCK_NEWER_NL_ID, NL, '2026-01-03T00:00:00Z'),
        ],
        undefined,
        { id: MOCK_POST_FEATURED_ID, locale: EN, defaultLocale: EN },
      );

      return postFeaturedModuleQuery
        .parse(raw)
        .posts?.map(({ post }) => post?._id);
    }

    it('keeps the newest featured posts through parsing', async () => {
      expect(
        await runParsedPosts({ postSource: POST_SOURCE.NEWEST_FEATURED }),
      ).toEqual([MOCK_NEWER_EN_ID, MOCK_OLDER_EN_ID]);
    });

    it('keeps pinned posts through parsing', async () => {
      expect(
        await runParsedPosts({
          postSource: POST_SOURCE.PINNED,
          posts: [mockReference(MOCK_OLDER_EN_ID, { _key: 'a' })],
        }),
      ).toEqual([MOCK_OLDER_EN_ID]);
    });
  });
});
