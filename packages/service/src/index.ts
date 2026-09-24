// Public surface of the data layer. web imports `service` — never the raw client.

import { createSkimService } from './features/editorial/skim';
import { createModulesService } from './features/entities/modules';
import { createPostsService } from './features/entities/posts';
import { createTagsService } from './features/entities/tags';
import { createTopicsService } from './features/entities/topics';
import { createFooterService } from './features/global/footer';
import { createNavigationService } from './features/global/navigation';
import { createNewsletterSettingsService } from './features/global/newsletter-settings';
import { createSiteSettingsService } from './features/global/site-settings';
import { createThemeSettingsService } from './features/global/theme-settings';
import { createContentModuleService } from './features/modules/content';
import { createCtaModuleService } from './features/modules/cta';
import { createFeatureListModuleService } from './features/modules/feature-list';
import { createHeroModuleService } from './features/modules/hero';
import { createHeroBlogModuleService } from './features/modules/hero-blog';
import { createHeroProfileModuleService } from './features/modules/hero-profile';
import { createHeroStatementModuleService } from './features/modules/hero-statement';
import { createLogoWallModuleService } from './features/modules/logo-wall';
import { createNewsletterModuleService } from './features/modules/newsletter';
import { createPostFeaturedModuleService } from './features/modules/post-featured';
import { createPostLatestModuleService } from './features/modules/post-latest';
import { createPostListModuleService } from './features/modules/post-list';
import { createPostRelatedModuleService } from './features/modules/post-related';
import { createStatsModuleService } from './features/modules/stats';
import { createTaxonomyListModuleService } from './features/modules/taxonomy-list';
import { createTestimonialModuleService } from './features/modules/testimonial';
import { createHomeService } from './features/pages/home';
import { createLandingPageService } from './features/pages/landing';
import { createPostService } from './features/pages/post';
import { createBlogService } from './features/pages/post-index';
import { createTagService } from './features/pages/tag';
import { createTagIndexService } from './features/pages/tag-index';
import { createTopicService } from './features/pages/topic';
import { createTopicIndexService } from './features/pages/topic-index';

export const service = {
  editorial: {
    skim: createSkimService(),
  },
  pages: {
    home: createHomeService(),
    landing: createLandingPageService(),
    blog: createBlogService(),
    post: createPostService(),
    topic: createTopicService(),
    topicIndex: createTopicIndexService(),
    tag: createTagService(),
    tagIndex: createTagIndexService(),
  },
  modules: {
    hero: createHeroModuleService(),
    heroBlog: createHeroBlogModuleService(),
    heroStatement: createHeroStatementModuleService(),
    heroProfile: createHeroProfileModuleService(),
    postList: createPostListModuleService(),
    postLatest: createPostLatestModuleService(),
    postFeatured: createPostFeaturedModuleService(),
    postRelated: createPostRelatedModuleService(),
    content: createContentModuleService(),
    cta: createCtaModuleService(),
    newsletter: createNewsletterModuleService(),
    taxonomyList: createTaxonomyListModuleService(),
    featureList: createFeatureListModuleService(),
    logoWall: createLogoWallModuleService(),
    testimonial: createTestimonialModuleService(),
    stats: createStatsModuleService(),
  },
  entities: {
    topics: createTopicsService(),
    tags: createTagsService(),
    posts: createPostsService(),
    modules: createModulesService(),
  },
  global: {
    siteSettings: createSiteSettingsService(),
    navigation: createNavigationService(),
    footer: createFooterService(),
    newsletterSettings: createNewsletterSettingsService(),
    themeSettings: createThemeSettingsService(),
  },
};

export type { TPostBody, TSaveSkimDraftInput } from './features/editorial/skim';
export type { TFeedPost } from './features/entities/posts';
export type { TTagsList, TTagWithPostCount } from './features/entities/tags';
export type {
  TTopicsList,
  TTopicWithPostCount,
} from './features/entities/topics';
export type { TFooter } from './features/global/footer';
export type { TNavigation } from './features/global/navigation';
export type { TNewsletterSettings } from './features/global/newsletter-settings';
export type { TBrand, TSiteSettings } from './features/global/site-settings';
export type { TThemeTokens } from './features/global/theme-settings';
export type { TContentModule } from './features/modules/content';
export type { TCtaModule } from './features/modules/cta';
export type {
  TFeatureListItem,
  TFeatureListModule,
} from './features/modules/feature-list';
export type { THeroModule } from './features/modules/hero';
export type {
  THeroBlogButton,
  THeroBlogModule,
} from './features/modules/hero-blog';
export type { THeroProfileModule } from './features/modules/hero-profile';
export type { THeroStatementModule } from './features/modules/hero-statement';
export type { TLogoItem, TLogoWallModule } from './features/modules/logo-wall';
export type { TNewsletterModule } from './features/modules/newsletter';
export type { TPostFeaturedModule } from './features/modules/post-featured';
export type { TPostLatestModule } from './features/modules/post-latest';
export type { TPostListModule } from './features/modules/post-list';
export type { TPostRelatedModule } from './features/modules/post-related';
export type { TStatItem, TStatsModule } from './features/modules/stats';
export type {
  TTaxonomyEntry,
  TTaxonomyListModule,
} from './features/modules/taxonomy-list';
export type {
  TTestimonialItem,
  TTestimonialModule,
} from './features/modules/testimonial';
export type { THomePage } from './features/pages/home';
export type { TLandingPage } from './features/pages/landing';
export type {
  TPostDetail,
  TPostDetailAuthor,
  TPostTakeaways,
} from './features/pages/post';
export type { TBlogIndexPage } from './features/pages/post-index';
export type { TTagDetailPage } from './features/pages/tag';
export type { TTagIndexPage } from './features/pages/tag-index';
export type { TTopicDetailPage } from './features/pages/topic';
export type { TTopicIndexPage } from './features/pages/topic-index';
export { urlForImage, urlForSanityImage } from './sanity/image';
export type { TSanityProjectRef, TImageTransformOptions } from './sanity/image';
export { getSanityImageBaseUrl } from './sanity/image-base-url';
export type { TTenantSanityContext } from './sanity/query';
export { getPlatformSanityContext } from './sanity/client';
export { getPlatformSanityWriteContext } from './sanity/write-client';
export type { TCtaButton } from './shared/transformers/cta/to-cta-button';
export type { THeroPrimaryAction } from './shared/transformers/hero/to-hero-primary-action';
export type { TModule } from './shared/transformers/module/to-module';
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardTopic,
} from './shared/transformers/post/to-post-card';
export type { IPortableTextLinkMark, TPortableTextLink } from '@blog/config';
export type { TPortableTextBody } from './shared/transformers/portable-text/to-portable-text-body';
export type { TSeoResolved } from './shared/transformers/seo/resolve-seo';
export type { TSocialProfile } from './shared/transformers/social-profile/to-social-profile';
export type { TTag } from './shared/transformers/tag/to-tag';
export type { TTopic } from './shared/transformers/topic/to-topic';
