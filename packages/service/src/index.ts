// Public surface of the data layer.
// Web imports these — never the raw Sanity client. Never import React here.
export {
  getPosts,
  getPost,
  getPostsByCategory,
  getCategories,
  getAuthor,
  getPage,
  getSiteSettings,
} from './queries';
export { urlForImage } from './image';
export type {
  PostSummary,
  PostDetail,
  CategoryItem,
  AuthorDetail,
  PageDetail,
  SiteSettingsData,
} from './queries';
