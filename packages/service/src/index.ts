// Public surface of the data layer.
// web imports these — never the raw Sanity client; never imports React here.

// Loader functions
export { getHomePage } from './features/pages/home';
export { getBlogPage } from './features/pages/blog';
export { getPost } from './features/pages/post';
export { getCategoryPage } from './features/pages/category';
export { getSiteSettings } from './features/global/site-settings';
export { getCategories } from './features/global/categories';
export { getAuthor } from './features/global/author';

// View-model types (T-prefixed)
export type { THomePage } from './features/pages/home';
export type { TBlogPage } from './features/pages/blog';
export type { TPostDetail } from './features/pages/post';
export type { TCategoryPage } from './features/pages/category';
export type { TSiteSettings } from './features/global/site-settings';
export type { TCategoriesList } from './features/global/categories';
export type { TAuthorDetail } from './features/global/author';

// Shared sub-types used in view-models
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardCategory,
  TPostDetailAuthor,
  TCategory,
  TNavItem,
  TSocialLink,
  TImage,
  TSeoMeta,
} from './shared/types';

// Image URL builder
export { urlForImage } from './sanity/image';
