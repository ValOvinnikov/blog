import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { translatedPostDocuments } from '@blog/service/testing/shared/translated-posts-dataset';

import { tagScopedPublishedPostsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

async function slugsIn(locale: string): Promise<string[]> {
  const posts = (await evaluateGroqExpression(
    tagScopedPublishedPostsQuery.query,
    translatedPostDocuments,
    undefined,
    { ...{ tagId: 'tag-1' }, locale, defaultLocale: EN },
  )) as { slug: string }[];

  return posts.map(({ slug }) => slug);
}

describe('tagScopedPublishedPostsQuery', () => {
  it('parses a feed post', () => {
    const raw = [makeRawFeedPost()];

    expect(() => tagScopedPublishedPostsQuery.parse(raw)).not.toThrow();
  });

  it('filters by page_post type', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain(
      '_type == "page_post"',
    );
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain(
      'publishedAt <= now()',
    );
  });

  it('orders newest first, same as the site-wide feed query', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain(
      'order(publishedAt desc)',
    );
  });

  it('scopes to the given tag id by reference identity', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain('references($tagId)');
  });

  it('does not deref author or an image asset', () => {
    expect(tagScopedPublishedPostsQuery.query).not.toContain('author->');
    expect(tagScopedPublishedPostsQuery.query).not.toContain('heroImage');
    expect(tagScopedPublishedPostsQuery.query).not.toContain('topic->');
    expect(tagScopedPublishedPostsQuery.query).not.toContain('wordCount');
  });

  it('lists only published posts in the request language, newest first', async () => {
    expect(await slugsIn(EN)).toEqual(['only-en', 'design-en', 'notes-en']);
    expect(await slugsIn(NL)).toEqual(['design-nl']);
  });
});
