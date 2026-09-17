import type {
  TPageHomeType,
  TPageLandingType,
  TPagePostIndexType,
  TPagePostType,
  TPageTagIndexType,
  TPageTagType,
  TPageTopicIndexType,
  TPageTopicType,
} from './page-module';

describe('page module type unions', () => {
  it('resolves page_home to its heroField and modulesField({ allow }) kinds', () => {
    expectTypeOf<TPageHomeType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_content'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postLatest'
      | 'module_taxonomyList'
      | 'module_postFeatured'
    >();
  });

  it('resolves page_post from modules[] alone', () => {
    expectTypeOf<TPagePostType>().toEqualTypeOf<
      'module_postRelated' | 'module_newsletter' | 'module_cta'
    >();
  });

  it('resolves page_landing', () => {
    expectTypeOf<TPageLandingType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_content'
      | 'module_cta'
      | 'module_postLatest'
      | 'module_postFeatured'
      | 'module_newsletter'
      | 'module_taxonomyList'
    >();
  });

  it('resolves page_postIndex', () => {
    expectTypeOf<TPagePostIndexType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_postList'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postFeatured'
    >();
  });

  it('resolves page_tag', () => {
    expectTypeOf<TPageTagType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_tagIndex', () => {
    expectTypeOf<TPageTagIndexType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_topic', () => {
    expectTypeOf<TPageTopicType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_topicIndex', () => {
    expectTypeOf<TPageTopicIndexType>().toEqualTypeOf<
      | 'module_hero'
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });
});
