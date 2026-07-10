// Public surface of the data layer. web imports `service` — never the raw client.

import { createAuthorService } from './features/entities/author';
import { createCategoriesService } from './features/entities/categories';
import { createFooterService } from './features/global/footer';
import { createNavigationService } from './features/global/navigation';
import { createSiteSettingsService } from './features/global/site-settings';
import { createBlogService } from './features/pages/blog';
import { createCategoryService } from './features/pages/category';
import { createHomeService } from './features/pages/home';
import { createPostService } from './features/pages/post';

export const service = {
  pages: {
    home: createHomeService(),
    blog: createBlogService(),
    post: createPostService(),
    category: createCategoryService(),
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
export type { TNavigation, TNavItem } from './features/global/navigation';
export type { TBrand, TSiteSettings } from './features/global/site-settings';
export type { TBlogPage } from './features/pages/blog';
export type { TCategoryPage } from './features/pages/category';
export type { THomePage } from './features/pages/home';
export type { TPostDetail, TPostDetailAuthor } from './features/pages/post';
export { urlForImage } from './sanity/image';
export type { TCategory } from './shared/transformers/to-category';
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardCategory,
} from './shared/transformers/to-post-card';
export type { TSeoMeta } from './shared/transformers/to-seo-meta';
export type { TSocialLink } from './shared/transformers/to-social-link';
