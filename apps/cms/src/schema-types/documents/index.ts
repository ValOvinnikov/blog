import { authorSchema } from './blog/author';
import { categorySchema } from './blog/category';
import { postSchema } from './blog/post';
import { homePageSchema } from './pages/home-page';
import { genericSchema } from './pages/page';
import { footerSchema } from './settings/footer';
import { navigationSchema } from './settings/navigation';
import { siteSchema } from './settings/site-settings';

export const documents = [
  postSchema,
  authorSchema,
  categorySchema,
  genericSchema,
  homePageSchema,
  siteSchema,
  navigationSchema,
  footerSchema,
];
