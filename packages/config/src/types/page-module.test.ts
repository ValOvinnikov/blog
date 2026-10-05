import type {
  TPageHomeType,
  TPageLandingType,
  TPagePostIndexType,
  TPagePostType,
  TPageTagIndexType,
  TPageTagType,
  TPageTemplateType,
  TPageTopicIndexType,
  TPageTopicType,
} from './page-module';

describe('page module type unions', () => {
  it('resolves page_template to its heroField and modulesField({ allow }) kinds', () => {
    expectTypeOf<TPageTemplateType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_heroStatement'
      | 'module_heroProfile'
      | 'module_content'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postLatest'
      | 'module_taxonomyList'
      | 'module_postFeatured'
      | 'module_featureList'
      | 'module_featureHighlights'
      | 'module_logoWall'
      | 'module_testimonial'
      | 'module_stats'
      | 'module_timeline'
      | 'module_faq'
      | 'module_team'
      | 'module_pricing'
    >();
  });

  it('resolves page_post from modules[] alone', () => {
    expectTypeOf<TPagePostType>().toEqualTypeOf<
      'module_postRelated' | 'module_newsletter' | 'module_cta'
    >();
  });

  it('gives page_home and page_landing the module kinds of the template they reference', () => {
    expectTypeOf<TPageHomeType>().toEqualTypeOf<TPageTemplateType>();
    expectTypeOf<TPageLandingType>().toEqualTypeOf<TPageTemplateType>();
  });

  it('resolves page_postIndex', () => {
    expectTypeOf<TPagePostIndexType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_postList'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postFeatured'
      | 'module_taxonomyList'
    >();
  });

  it('resolves page_tag', () => {
    expectTypeOf<TPageTagType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_taxonomyList'
    >();
  });

  it('resolves page_tagIndex', () => {
    expectTypeOf<TPageTagIndexType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });

  it('resolves page_topic', () => {
    expectTypeOf<TPageTopicType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_taxonomyList'
    >();
  });

  it('resolves page_topicIndex', () => {
    expectTypeOf<TPageTopicIndexType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
    >();
  });
});
