import { getRevalidateTagsForType } from './revalidate-tags';

describe('getRevalidateTagsForType', () => {
  it('maps the topic document type to its ISR tags', () => {
    expect(getRevalidateTagsForType('blog_topic', 'topic-1')).toEqual([
      'topic',
      'topics',
      'posts',
    ]);
  });

  it('maps a known document type to its ISR tags', () => {
    expect(getRevalidateTagsForType('blog_post', 'post-1')).toEqual([
      'post',
      'posts',
      'homePage',
    ]);
  });

  it('maps the blog-index singleton to its ISR tag', () => {
    expect(getRevalidateTagsForType('page_blog', 'page_blog')).toEqual([
      'page_blog',
    ]);
  });

  it('maps the topic page document to its ISR tag', () => {
    expect(getRevalidateTagsForType('page_topic', 'page_topic-1')).toEqual([
      'page_topic',
    ]);
  });

  it('maps the topic-index singleton to its ISR tag', () => {
    expect(
      getRevalidateTagsForType('page_topicIndex', 'page_topicIndex'),
    ).toEqual(['page_topicIndex']);
  });

  it('includes the per-document tag for module types', () => {
    expect(getRevalidateTagsForType('module_hero', 'hero-1')).toEqual([
      'modules:hero',
      'module:hero-1',
    ]);
  });

  it('maps the post-latest teaser module to its ISR tag plus the per-document tag', () => {
    expect(
      getRevalidateTagsForType('module_postLatest', 'post-latest-1'),
    ).toEqual(['modules:postLatest', 'module:post-latest-1']);
  });

  it('maps the newsletter module to its ISR tag plus the per-document tag', () => {
    expect(
      getRevalidateTagsForType('module_newsletter', 'newsletter-1'),
    ).toEqual(['modules:newsletter', 'module:newsletter-1']);
  });

  it('maps the newsletter settings singleton to its ISR tag', () => {
    expect(
      getRevalidateTagsForType('settings_newsletter', 'settings-newsletter'),
    ).toEqual(['newsletter-settings']);
  });

  it('returns an empty list for an unknown type', () => {
    expect(getRevalidateTagsForType('nope', 'x')).toEqual([]);
  });

  // Deliberately covers all module types, including three with dedicated
  // exact-tag assertions above — this loop's job isn't to duplicate those,
  // it's to confirm the `module:<id>` append fires for *every* module key,
  // which no single test above checks across the full set.
  it.each([
    'module_hero',
    'module_postList',
    'module_taxonomyList',
    'module_postLatest',
    'module_content',
    'module_cta',
    'module_newsletter',
  ])('resolves a non-empty tag list plus module:<id> for %s', (type) => {
    const tags = getRevalidateTagsForType(type, 'doc-1');
    expect(tags.length).toBeGreaterThan(0);
    expect(tags).toContain('module:doc-1');
  });

  // Security: the type comes from the webhook body. The `switch` must return no
  // tags for these prototype/method names — never dispatch to an inherited
  // function (CodeQL js/unvalidated-dynamic-method-call).
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'returns no tags (and does not throw) for the prototype key %s',
    (type) => {
      expect(getRevalidateTagsForType(type, 'x')).toEqual([]);
    },
  );
});
