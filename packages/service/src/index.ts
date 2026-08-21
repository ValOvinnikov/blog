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
import { createNewsletterModuleService } from './features/modules/newsletter';
import { createPostLatestModuleService } from './features/modules/post-latest';
import { createPostListModuleService } from './features/modules/post-list';
import { createAuthorService } from './features/pages/author';
import { createBlogService } from './features/pages/blog';
import { createGenericPageService } from './features/pages/generic';
import { createHomeService } from './features/pages/home';
import { createPostService } from './features/pages/post';
import { createTagService } from './features/pages/tag';
import { createTopicService } from './features/pages/topic';

export const service = {
  editorial: {
    skim: createSkimService(),
  },
  pages: {
    home: createHomeService(),
    generic: createGenericPageService(),
    blog: createBlogService(),
    post: createPostService(),
    topic: createTopicService(),
    tag: createTagService(),
    author: createAuthorService(),
  },
  modules: {
    hero: createHeroModuleService(),
    postList: createPostListModuleService(),
    postLatest: createPostLatestModuleService(),
    content: createContentModuleService(),
    cta: createCtaModuleService(),
    newsletter: createNewsletterModuleService(),
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
export type { TNewsletterModule } from './features/modules/newsletter';
export type { TPostLatestModule } from './features/modules/post-latest';
export type { TPostListModule } from './features/modules/post-list';
export type { TAuthorDetail, TAuthorPage } from './features/pages/author';
export type { TBlogIndexPage } from './features/pages/blog';
export type { TGenericPage } from './features/pages/generic';
export type { THomePage } from './features/pages/home';
export type {
  TPostDetail,
  TPostDetailAuthor,
  TPostSkim,
} from './features/pages/post';
export type { TTagPage } from './features/pages/tag';
export type { TTopicPage } from './features/pages/topic';
export { getSanityImageBaseUrl } from './sanity/image-base-url';
export { urlForImage } from './sanity/image';
export type { TTenantSanityContext } from './sanity/query';
export { buildImageUrl } from './shared/transformers/build-image-url';
export type { TRawImage } from './shared/transformers/build-image-url';
export type { TArchivePostCard } from './shared/transformers/to-archive-post-card';
export type { TModule } from './shared/transformers/to-module';
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardTopic,
} from './shared/transformers/to-post-card';
export type { TSeoResolved } from './shared/transformers/resolve-seo';
export type { TSocialLink } from './shared/transformers/to-social-link';
export type { TTag } from './shared/transformers/to-tag';
export type { TTopic } from './shared/transformers/to-topic';
