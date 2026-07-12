import author from './blog/author';
import category from './blog/category';
import post from './blog/post';
import { homeSchema } from './pages/home-page';
import { genericSchema } from './pages/page';
import { footerSchema } from './settings/footer';
import { navigationSchema } from './settings/navigation';
import { siteSchema } from './settings/site-settings';

export const documents = [
  post,
  author,
  category,
  genericSchema,
  homeSchema,
  siteSchema,
  navigationSchema,
  footerSchema,
];
