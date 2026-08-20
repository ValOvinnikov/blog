import { MODULE_PAGE_CONTEXT } from '@blog/config';

import {
  postListModulePaginatedPostsQuery,
  postListModulePostsQuery,
} from './posts.query';

const OLD_QUERY =
  '*[_type == "blog_post"][publishedAt <= now()] | order(publishedAt desc)[0...6] { _id, title, "slug": slug.current, excerpt, publishedAt, "heroImage": heroImage { _type, asset, alt, hotspot, crop }, "heroImageAsset": heroImage { alt, hotspot, crop, "asset": asset-> { _id, "metadata": metadata { lqip, "dimensions": dimensions { width, height, aspectRatio } } } }, featured, "author": author-> { _id, name, "slug": slug.current, "image": image { _type, asset, alt, hotspot, crop } }, "topic": topic-> { _id, title, "slug": slug.current, description }, "wordCount": coalesce(count(string::split(pt::text(body), " ")[@ != ""]), 0) }';

describe('postListModulePostsQuery', () => {
  it('limits the posts to the given count in GROQ (end-exclusive slice)', () => {
    // The whole point of the fix: Sanity must return at most `limit` posts,
    // not the entire collection sliced in JS.
    expect(postListModulePostsQuery(3).query).toContain('[0...3]');
    expect(postListModulePostsQuery(6).query).toContain('[0...6]');
  });

  it('orders by newest first', () => {
    expect(postListModulePostsQuery(3).query).toContain(
      'order(publishedAt desc)',
    );
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(postListModulePostsQuery(3).query).toContain('publishedAt <= now()');
  });

  it('emits the exact same query with no context as before page-context support existed', () => {
    expect(postListModulePostsQuery(6).query).toBe(OLD_QUERY);
  });

  it.each([
    MODULE_PAGE_CONTEXT.HOME,
    MODULE_PAGE_CONTEXT.BLOG,
    MODULE_PAGE_CONTEXT.GENERIC,
  ] as const)('emits the unscoped query for a %s context', (type) => {
    expect(
      postListModulePostsQuery(6, { type, isPaginated: false }).query,
    ).toBe(OLD_QUERY);
  });

  it('scopes by topic, reusing the topic archive filter expression', () => {
    const query = postListModulePostsQuery(6, {
      type: MODULE_PAGE_CONTEXT.TOPIC,
      topicSlug: 'engineering',
      isPaginated: false,
    }).query;

    expect(query).toContain('topic->slug.current == $slug');
  });

  it('scopes by tag, reusing the tag archive filter expression', () => {
    const query = postListModulePostsQuery(6, {
      type: MODULE_PAGE_CONTEXT.TAG,
      tagSlug: 'react',
      isPaginated: false,
    }).query;

    expect(query).toContain('$slug in tags[]->slug.current');
  });
});

describe('postListModulePaginatedPostsQuery', () => {
  it('windows by page number and page size (end-exclusive slice)', () => {
    const query = postListModulePaginatedPostsQuery({
      type: MODULE_PAGE_CONTEXT.BLOG,
      isPaginated: true,
      page: 2,
      pageSize: 9,
    }).query;

    expect(query).toContain('[9...18]');
  });

  it('returns the total match count alongside the windowed posts', () => {
    const query = postListModulePaginatedPostsQuery({
      type: MODULE_PAGE_CONTEXT.BLOG,
      isPaginated: true,
      page: 1,
      pageSize: 9,
    }).query;

    expect(query).toContain('"total": count(');
  });

  it('scopes the window and the total by topic', () => {
    const query = postListModulePaginatedPostsQuery({
      type: MODULE_PAGE_CONTEXT.TOPIC,
      topicSlug: 'engineering',
      isPaginated: true,
      page: 1,
      pageSize: 9,
    }).query;

    expect(query.match(/topic->slug\.current == \$slug/g)).toHaveLength(2);
  });
});
