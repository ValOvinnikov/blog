import { authorSchema } from './blog/author';
import { tagSchema } from './blog/tag';
import { topicSchema } from './blog/topic';
import { blogPageSchema } from './pages/blog';
import { homePageSchema } from './pages/home';
import { landingSchema } from './pages/landing';
import { pagePostSchema } from './pages/post';
import { pageTagSchema } from './pages/tag';
import { tagIndexPageSchema } from './pages/tag-index';
import { pageTopicSchema } from './pages/topic';
import { topicIndexPageSchema } from './pages/topic-index';
import { footerSchema } from './settings/footer';
import { navigationSchema } from './settings/navigation';
import { newsletterSettingsSchema } from './settings/newsletter';
import { siteSchema } from './settings/site-settings';
import { themeSchema } from './settings/theme';
import { migrationStateSchema } from './system/migration-state';

export const documents = [
  authorSchema,
  topicSchema,
  tagSchema,
  landingSchema,
  homePageSchema,
  blogPageSchema,
  topicIndexPageSchema,
  pageTopicSchema,
  pagePostSchema,
  tagIndexPageSchema,
  pageTagSchema,
  siteSchema,
  navigationSchema,
  footerSchema,
  newsletterSettingsSchema,
  themeSchema,
  migrationStateSchema,
];
