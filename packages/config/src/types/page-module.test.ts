import type {
  TPageHomeModuleTypes,
  TPageLandingModuleTypes,
  TPagePostIndexModuleTypes,
  TPagePostModuleTypes,
  TPageTagIndexModuleTypes,
  TPageTagModuleTypes,
  TPageTopicIndexModuleTypes,
  TPageTopicModuleTypes,
} from './page-module';

describe('page module type unions', () => {
  it('resolves page_home to its heroField and modulesField({ allow }) kinds', () => {
    expectTypeOf<TPageHomeModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPageHomeModuleTypes['modules']>().toEqualTypeOf<
      | 'module_content'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postLatest'
      | 'module_taxonomyList'
      | 'module_postFeatured'
    >();
  });

  it('resolves page_post from modules[] alone, with no hero key', () => {
    expectTypeOf<TPagePostModuleTypes['modules']>().toEqualTypeOf<
      'module_postRelated' | 'module_newsletter' | 'module_cta'
    >();
    expectTypeOf<
      'hero' extends keyof TPagePostModuleTypes ? true : false
    >().toEqualTypeOf<false>();
  });

  it('resolves page_landing', () => {
    expectTypeOf<TPageLandingModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPageLandingModuleTypes['modules']>().toEqualTypeOf<
      | 'module_content'
      | 'module_cta'
      | 'module_postLatest'
      | 'module_postFeatured'
      | 'module_newsletter'
      | 'module_taxonomyList'
    >();
  });

  it('resolves page_postIndex', () => {
    expectTypeOf<TPagePostIndexModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPagePostIndexModuleTypes['modules']>().toEqualTypeOf<
      | 'module_postList'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postFeatured'
    >();
  });

  it('resolves page_tag', () => {
    expectTypeOf<TPageTagModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPageTagModuleTypes['modules']>().toEqualTypeOf<
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_tagIndex', () => {
    expectTypeOf<TPageTagIndexModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPageTagIndexModuleTypes['modules']>().toEqualTypeOf<
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_topic', () => {
    expectTypeOf<TPageTopicModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPageTopicModuleTypes['modules']>().toEqualTypeOf<
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_topicIndex', () => {
    expectTypeOf<TPageTopicIndexModuleTypes['hero']>().toEqualTypeOf<
      'module_hero' | 'module_heroBlog' | 'module_heroStatement'
    >();
    expectTypeOf<TPageTopicIndexModuleTypes['modules']>().toEqualTypeOf<
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });
});
