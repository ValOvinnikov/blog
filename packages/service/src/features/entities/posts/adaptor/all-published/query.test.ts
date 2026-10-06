import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { translatedPostDocuments } from '@blog/service/testing/shared/translated-posts-dataset';

import { allPublishedPostsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

async function slugsIn(locale: string): Promise<string[]> {
  const posts = (await evaluateGroqExpression(
    allPublishedPostsQuery.query,
    translatedPostDocuments,
    undefined,
    { ...{}, locale, defaultLocale: EN },
  )) as { slug: string }[];

  return posts.map(({ slug }) => slug);
}

describe('allPublishedPostsQuery', () => {
  it('parses a feed post', () => {
    const raw = [makeRawFeedPost()];

    expect(() => allPublishedPostsQuery.parse(raw)).not.toThrow();
  });

  it('filters by page_post type', () => {
    expect(allPublishedPostsQuery.query).toContain('_type == "page_post"');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(allPublishedPostsQuery.query).toContain('publishedAt <= now()');
  });

  it('orders newest first, same as the paginated post-list query', () => {
    expect(allPublishedPostsQuery.query).toContain('order(publishedAt desc)');
  });

  it('does not deref author or an image asset', () => {
    expect(allPublishedPostsQuery.query).not.toContain('author->');
    expect(allPublishedPostsQuery.query).not.toContain('heroImage');
    expect(allPublishedPostsQuery.query).not.toContain('topic->');
    expect(allPublishedPostsQuery.query).not.toContain('wordCount');
  });

  it('lists only published posts in the request language, newest first', async () => {
    expect(await slugsIn(EN)).toEqual(['only-en', 'design-en', 'notes-en']);
    expect(await slugsIn(NL)).toEqual(['design-nl']);
  });
});
