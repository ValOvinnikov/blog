// Public surface of the data layer. web imports `service` — never the raw client.

import { createAuthorService } from './features/entities/author';
import { createCategoriesService } from './features/entities/categories';
import { createFooterService } from './features/global/footer';
import { createNavigationService } from './features/global/navigation';
import { createSiteSettingsService } from './features/global/site-settings';
import { createContentModuleService } from './features/modules/content';
import { createCtaModuleService } from './features/modules/cta';
import { createHeroModuleService } from './features/modules/hero';
import { createPostListModuleService } from './features/modules/post-list';
import { createBlogService } from './features/pages/blog';
import { createCategoryService } from './features/pages/category';
import { createGenericPageService } from './features/pages/generic';
import { createHomeService } from './features/pages/home';
import { createPostService } from './features/pages/post';

export const service = {
  pages: {
    home: createHomeService(),
    generic: createGenericPageService(),
    blog: createBlogService(),
    post: createPostService(),
    category: createCategoryService(),
  },
  modules: {
    hero: createHeroModuleService(),
    postList: createPostListModuleService(),
    content: createContentModuleService(),
    cta: createCtaModuleService(),
  },
  entities: {
    author: createAuthorService(),
    categories: createCategoriesService(),
  },
  global: {
    siteSettings: createSiteSettingsService(),
    navigation: createNavigationService(),
    footer: createFooterService(),
  },
};

export type { TAuthorDetail } from './features/entities/author';
export type { TCategoriesList } from './features/entities/categories';
export type { TFooter } from './features/global/footer';
export type { TNavigation } from './features/global/navigation';
export type { TBrand, TSiteSettings } from './features/global/site-settings';
export type { TContentModule } from './features/modules/content';
export type { TCtaModule } from './features/modules/cta';
export type { THeroModule } from './features/modules/hero';
export type { TPostListModule } from './features/modules/post-list';
export type { TBlogPage } from './features/pages/blog';
export type { TCategoryPage } from './features/pages/category';
export type { TGenericPage } from './features/pages/generic';
export type { THomePage } from './features/pages/home';
export type { TPostDetail, TPostDetailAuthor } from './features/pages/post';
export { urlForImage } from './sanity/image';
export type { TCategory } from './shared/transformers/to-category';
export type { TModule } from './shared/transformers/to-module';
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardCategory,
} from './shared/transformers/to-post-card';
export type { TSeoMeta } from './shared/transformers/to-seo-meta';
export type { TSocialLink } from './shared/transformers/to-social-link';
