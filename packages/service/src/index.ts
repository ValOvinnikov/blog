// Public surface of the data layer. web imports `service` — never the raw client.

import { createSkimService } from './features/editorial/skim';
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
import { createHeroModuleService } from './features/modules/hero';
import { createHeroBlogModuleService } from './features/modules/hero-blog';
import { createNewsletterModuleService } from './features/modules/newsletter';
import { createPostFeaturedModuleService } from './features/modules/post-featured';
import { createPostLatestModuleService } from './features/modules/post-latest';
import { createPostListModuleService } from './features/modules/post-list';
import { createPostRelatedModuleService } from './features/modules/post-related';
import { createTaxonomyListModuleService } from './features/modules/taxonomy-list';
import { createBlogService } from './features/pages/blog';
import { createHomeService } from './features/pages/home';
import { createLandingPageService } from './features/pages/landing';
import { createPostService } from './features/pages/post';
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
    postList: createPostListModuleService(),
    postLatest: createPostLatestModuleService(),
    postFeatured: createPostFeaturedModuleService(),
    postRelated: createPostRelatedModuleService(),
    content: createContentModuleService(),
    cta: createCtaModuleService(),
    newsletter: createNewsletterModuleService(),
    taxonomyList: createTaxonomyListModuleService(),
  },
  entities: {
    topics: createTopicsService(),
    tags: createTagsService(),
    posts: createPostsService(),
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
export type { THeroModule } from './features/modules/hero';
export type { THeroBlogModule } from './features/modules/hero-blog';
export type { TNewsletterModule } from './features/modules/newsletter';
export type { TPostFeaturedModule } from './features/modules/post-featured';
export type { TPostLatestModule } from './features/modules/post-latest';
export type { TPostListModule } from './features/modules/post-list';
export type { TPostRelatedModule } from './features/modules/post-related';
export type {
  TTaxonomyEntry,
  TTaxonomyListModule,
} from './features/modules/taxonomy-list';
export type { TBlogIndexPage } from './features/pages/blog';
export type { THomePage } from './features/pages/home';
export type { TLandingPage } from './features/pages/landing';
export type {
  TPostDetail,
  TPostDetailAuthor,
  TPostSkim,
} from './features/pages/post';
export type { TTagDetailPage } from './features/pages/tag';
export type { TTagIndexPage } from './features/pages/tag-index';
export type { TTopicDetailPage } from './features/pages/topic';
export type { TTopicIndexPage } from './features/pages/topic-index';
export { urlForImage } from './sanity/image';
export type { TTenantSanityContext } from './sanity/query';
export { getPlatformSanityContext } from './sanity/client';
export { getPlatformSanityWriteContext } from './sanity/write-client';
export { buildImageUrl } from './shared/transformers/build-image-url';
export type { TRawImage } from './shared/transformers/build-image-url';
export type { TArchivePostCard } from './shared/transformers/to-archive-post-card';
export type { TCtaAction } from './shared/transformers/to-cta-action';
export type { THeroPrimaryAction } from './shared/transformers/to-hero-primary-action';
export type { TModule } from './shared/transformers/to-module';
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardTopic,
} from './shared/transformers/to-post-card';
export type { TRequiredHeadingBlock } from './shared/transformers/to-heading-block';
export type { TSeoResolved } from './shared/transformers/resolve-seo';
export type { TSocialLink } from './shared/transformers/to-social-link';
export type { TTag } from './shared/transformers/to-tag';
export type { TTopic } from './shared/transformers/to-topic';
