import author from './blog/author';
import category from './blog/category';
import post from './blog/post';
import { homePageSchema } from './pages/home-page';
import { genericSchema } from './pages/page';
import { footerSchema } from './settings/footer';
import { navigationSchema } from './settings/navigation';
import { siteSchema } from './settings/site-settings';

export const documents = [
  post,
  author,
  category,
  genericSchema,
  homePageSchema,
  siteSchema,
  navigationSchema,
  footerSchema,
];
