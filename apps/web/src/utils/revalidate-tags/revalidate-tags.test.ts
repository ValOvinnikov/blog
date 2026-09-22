import { getRevalidateTagsForType } from './revalidate-tags';

describe('getRevalidateTagsForType', () => {
  it('maps the topic document type to its ISR tags', () => {
    expect(getRevalidateTagsForType('blog_topic', 'topic-1')).toEqual([
      'topic',
      'topics',
      'posts',
    ]);
  });

  it('maps the tag document type to its ISR tags', () => {
    expect(getRevalidateTagsForType('blog_tag', 'tag-1')).toEqual([
      'tag',
      'tags',
      'posts',
    ]);
  });

  it('maps the post-index singleton to its ISR tag', () => {
    expect(
      getRevalidateTagsForType('page_postIndex', 'page_postIndex'),
    ).toEqual(['page_postIndex']);
  });

  it('maps the post page document to its ISR tags', () => {
    expect(getRevalidateTagsForType('page_post', 'page_post-1')).toEqual([
      'page_post',
      'posts',
      'author',
      'topic',
      'tag',
    ]);
  });

  it('maps the tag page document to its ISR tag', () => {
    expect(getRevalidateTagsForType('page_tag', 'page_tag-1')).toEqual([
      'page_tag',
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

  it('maps the tag-index singleton to its ISR tag', () => {
    expect(getRevalidateTagsForType('page_tagIndex', 'page_tagIndex')).toEqual([
      'page_tagIndex',
    ]);
  });

  it('maps the theme settings singleton to its ISR tag', () => {
    expect(
      getRevalidateTagsForType('settings_theme', 'settings-theme'),
    ).toEqual(['theme-settings']);
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

  it('maps the post-related module to its ISR tag plus the per-document tag', () => {
    expect(
      getRevalidateTagsForType('module_postRelated', 'post-related-1'),
    ).toEqual(['modules:postRelated', 'module:post-related-1']);
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

  it('maps the link document type to its ISR tag', () => {
    expect(getRevalidateTagsForType('link', 'link-1')).toEqual(['link']);
  });

  it('maps the feature card document type to its ISR tag', () => {
    expect(getRevalidateTagsForType('block_feature', 'feature-1')).toEqual([
      'block_feature',
    ]);
  });

  it('maps the testimonial card document type to its ISR tag', () => {
    expect(
      getRevalidateTagsForType('block_testimonial', 'testimonial-1'),
    ).toEqual(['block_testimonial']);
  });

  it('returns an empty list for an unknown type', () => {
    expect(getRevalidateTagsForType('nope', 'x')).toEqual([]);
  });

  it.each([
    'module_hero',
    'module_postList',
    'module_taxonomyList',
    'module_postLatest',
    'module_postRelated',
    'module_featureList',
    'module_testimonial',
    'module_content',
    'module_cta',
    'module_newsletter',
  ])('resolves a non-empty tag list plus module:<id> for %s', (type) => {
    const tags = getRevalidateTagsForType(type, 'doc-1');
    expect(tags.length).toBeGreaterThan(0);
    expect(tags).toContain('module:doc-1');
  });

  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'returns no tags (and does not throw) for the prototype key %s',
    (type) => {
      expect(getRevalidateTagsForType(type, 'x')).toEqual([]);
    },
  );
});
