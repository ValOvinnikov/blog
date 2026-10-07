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
  it('resolves page_home from the heroField and modulesField({ allow }) kinds of template_home', () => {
    expectTypeOf<TPageHomeType>().toEqualTypeOf<
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
      | 'module_postRelated'
      | 'module_newsletter'
      | 'module_cta'
      | 'module_postLatest'
      | 'module_taxonomyList'
    >();
  });

  it('resolves page_landing from template_landing', () => {
    expectTypeOf<TPageLandingType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_sectionPages'
      | 'module_heroStatement'
      | 'module_heroProfile'
      | 'module_content'
      | 'module_cta'
      | 'module_postLatest'
      | 'module_postFeatured'
      | 'module_newsletter'
      | 'module_taxonomyList'
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

  it('resolves page_postIndex from template_postIndex', () => {
    expectTypeOf<TPagePostIndexType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_postList'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_postFeatured'
      | 'module_taxonomyList'
      | 'module_content'
      | 'module_postLatest'
    >();
  });

  it('resolves page_tag from template_tag', () => {
    expectTypeOf<TPageTagType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_taxonomyList'
      | 'module_content'
      | 'module_faq'
    >();
  });

  it('resolves page_tagIndex from template_tagIndex', () => {
    expectTypeOf<TPageTagIndexType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_content'
    >();
  });

  it('resolves page_topic from template_topic', () => {
    expectTypeOf<TPageTopicType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_postList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_taxonomyList'
      | 'module_content'
      | 'module_faq'
    >();
  });

  it('resolves page_topicIndex from template_topicIndex', () => {
    expectTypeOf<TPageTopicIndexType>().toEqualTypeOf<
      | 'module_heroBlog'
      | 'module_taxonomyList'
      | 'module_postLatest'
      | 'module_cta'
      | 'module_newsletter'
      | 'module_content'
    >();
  });
});
