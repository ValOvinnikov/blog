import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';
import {
  toIds,
  pinnedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { postFeaturedModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const moduleDocument = {
  _id: 'module-1',
  _type: 'module_postFeatured',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Latest posts',
      [NL]: 'Nieuwste berichten',
    }),
  },
  postSource: 'PINNED',
  posts: [],
};

async function runPostFeatured(locale: string) {
  const raw = await evaluateGroqExpression(
    postFeaturedModuleQuery.query,
    [moduleDocument],
    undefined,
    { id: 'module-1', locale, defaultLocale: EN },
  );

  return postFeaturedModuleQuery.parse(raw);
}

describe('postFeaturedModuleQuery', () => {
  it('filters to module_postFeatured documents by id', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      '_type == "module_postFeatured"',
    );
    expect(postFeaturedModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawPostFeaturedModule(), headingBlock: null };

    expect(() => postFeaturedModuleQuery.parse(raw)).toThrow();
  });

  it('projects postSource and limit', () => {
    expect(postFeaturedModuleQuery.query).toContain('postSource');
    expect(postFeaturedModuleQuery.query).toContain('limit');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      'coalesce(showImages, true)',
    );
  });

  it('coalesces displayMode to GRID for documents authored before the field existed', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });
  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostFeatured(NL);

    expect(headingBlock.heading).toBe('Nieuwste berichten');
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostFeatured(FR);

    expect(headingBlock.heading).toBe('Latest posts');
  });
});

describe('postFeaturedModuleQuery language scoping', () => {
  async function runPosts(
    module: Record<string, unknown>,
    locale: string,
  ): Promise<string[]> {
    const raw = (await evaluateGroqExpression(
      postFeaturedModuleQuery.query,
      [{ ...moduleDocument, ...module }, ...pinnedPostDocuments],
      undefined,
      { id: 'module-1', locale, defaultLocale: EN },
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
    postSource: 'PINNED',
    posts: [
      { _key: 'a', _type: 'reference', _ref: 'only-en' },
      { _key: 'b', _type: 'reference', _ref: 'design-en' },
    ],
  };

  it('keeps pinned posts in authored order in their own language', async () => {
    expect(await runPosts(pinned, EN)).toEqual(['only-en', 'design-en']);
  });

  it('swaps a pinned post for its translation and drops one with none', async () => {
    expect(await runPosts(pinned, NL)).toEqual(['design-nl']);
  });

  it('keeps a pinned post without a translation group in its own language', async () => {
    expect(
      await runPosts(
        {
          postSource: 'PINNED',
          posts: [{ _key: 'a', _type: 'reference', _ref: 'solo-nl' }],
        },
        NL,
      ),
    ).toEqual(['solo-nl']);
  });

  it('drops a pinned post without a translation group in another language', async () => {
    expect(
      await runPosts(
        {
          postSource: 'PINNED',
          posts: [{ _key: 'a', _type: 'reference', _ref: 'solo-nl' }],
        },
        EN,
      ),
    ).toEqual([]);
  });

  it('drops a pinned post whose translation is scheduled', async () => {
    expect(
      await runPosts(
        {
          postSource: 'PINNED',
          posts: [{ _key: 'a', _type: 'reference', _ref: 'launch-en' }],
        },
        NL,
      ),
    ).toEqual([]);
  });

  it('drops a pinned scheduled post', async () => {
    expect(
      await runPosts(
        {
          postSource: 'PINNED',
          posts: [{ _key: 'a', _type: 'reference', _ref: 'scheduled-nl' }],
        },
        NL,
      ),
    ).toEqual([]);
  });

  it('falls back to the newest featured posts in the request language', async () => {
    const newest = { postSource: 'NEWEST_FEATURED' };

    expect(await runPosts(newest, EN)).toEqual(['only-en', 'design-en']);
    expect(await runPosts(newest, NL)).toEqual(['design-nl']);
  });
});

describe('postFeaturedModuleQuery parsed posts', () => {
  const topic = {
    _id: 'topic-1',
    _type: 'blog_topic',
    title: localizedStrings({ [EN]: 'Design' }),
  };
  const author = { _id: 'person-1', _type: 'person', name: 'Ada' };

  function postDocument(id: string, language: string, publishedAt: string) {
    return {
      _id: id,
      _type: 'page_post',
      language,
      featured: true,
      publishedAt,
      slug: { current: id },
      headingBlock: { _type: 'pageHeadingBlock', heading: id },
      author: { _type: 'reference', _ref: 'person-1' },
      topic: { _type: 'reference', _ref: 'topic-1' },
    };
  }

  async function runParsedPosts(module: Record<string, unknown>) {
    const raw = await evaluateGroqExpression(
      postFeaturedModuleQuery.query,
      [
        { ...moduleDocument, ...module },
        topic,
        author,
        postDocument('older-en', EN, '2026-01-01T00:00:00Z'),
        postDocument('newer-en', EN, '2026-01-02T00:00:00Z'),
        postDocument('newer-nl', NL, '2026-01-03T00:00:00Z'),
      ],
      undefined,
      { id: 'module-1', locale: EN, defaultLocale: EN },
    );

    return postFeaturedModuleQuery
      .parse(raw)
      .posts?.map(({ post }) => post?._id);
  }

  it('keeps the newest featured posts through parsing', async () => {
    expect(await runParsedPosts({ postSource: 'NEWEST_FEATURED' })).toEqual([
      'newer-en',
      'older-en',
    ]);
  });

  it('keeps pinned posts through parsing', async () => {
    expect(
      await runParsedPosts({
        postSource: 'PINNED',
        posts: [{ _key: 'a', _type: 'reference', _ref: 'older-en' }],
      }),
    ).toEqual(['older-en']);
  });
});
