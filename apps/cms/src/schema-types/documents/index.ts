import { authorSchema } from './blog/author';
import { categorySchema } from './blog/category';
import { postSchema } from './blog/post';
import { tagSchema } from './blog/tag';
import { blogPageSchema } from './pages/blog-page';
import { homePageSchema } from './pages/home-page';
import { genericSchema } from './pages/page';
import { footerSchema } from './settings/footer';
import { navigationSchema } from './settings/navigation';
import { siteSchema } from './settings/site-settings';

export const documents = [
  postSchema,
  authorSchema,
  categorySchema,
  tagSchema,
  genericSchema,
  homePageSchema,
  blogPageSchema,
  siteSchema,
  navigationSchema,
  footerSchema,
];
