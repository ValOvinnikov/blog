import type {
  TPageHomeModuleType,
  TPageLandingModuleType,
  TPagePostIndexModuleType,
  TPagePostModuleType,
  TPageTagIndexModuleType,
  TPageTagModuleType,
  TPageTopicIndexModuleType,
  TPageTopicModuleType,
} from './page-module';

describe('page module type unions', () => {
  it('resolves page_home to its heroField and modulesField({ allow }) kinds', () => {
    expectTypeOf<TPageHomeModuleType>().toEqualTypeOf<
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

  it('resolves page_post from modules[] alone, with no hero field', () => {
    expectTypeOf<TPagePostModuleType>().toEqualTypeOf<
      'module_postRelated' | 'module_newsletter' | 'module_cta'
    >();
  });

  it('resolves page_landing', () => {
    expectTypeOf<TPageLandingModuleType>().toEqualTypeOf<
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
    expectTypeOf<TPagePostIndexModuleType>().toEqualTypeOf<
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
    expectTypeOf<TPageTagModuleType>().toEqualTypeOf<
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
    expectTypeOf<TPageTagIndexModuleType>().toEqualTypeOf<
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
    expectTypeOf<TPageTopicModuleType>().toEqualTypeOf<
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
    expectTypeOf<TPageTopicIndexModuleType>().toEqualTypeOf<
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
