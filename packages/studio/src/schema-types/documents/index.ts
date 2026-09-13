import { authorSchema } from './blog/author/author';
import { tagSchema } from './blog/tag/tag';
import { topicSchema } from './blog/topic/topic';
import { blogPageSchema } from './pages/blog/blog';
import { homePageSchema } from './pages/home/home';
import { landingPageSchema } from './pages/landing/landing';
import { postPageSchema } from './pages/post/post';
import { postIndexPageSchema } from './pages/post-index/post-index';
import { tagPageSchema } from './pages/tag/tag';
import { tagIndexPageSchema } from './pages/tag-index/tag-index';
import { topicPageSchema } from './pages/topic/topic';
import { topicIndexPageSchema } from './pages/topic-index/topic-index';
import { footerSettingsSchema } from './settings/footer/footer';
import { navigationSettingsSchema } from './settings/navigation/navigation';
import { newsletterSettingsSchema } from './settings/newsletter/newsletter';
import { siteSettingsSchema } from './settings/site-settings/site-settings';
import { themeSettingsSchema } from './settings/theme/theme';
import { migrationStateSchema } from './system/migration-state/migration-state';

export const documents = [
  authorSchema,
  topicSchema,
  tagSchema,
  landingPageSchema,
  homePageSchema,
  blogPageSchema,
  postIndexPageSchema,
  topicIndexPageSchema,
  topicPageSchema,
  postPageSchema,
  tagIndexPageSchema,
  tagPageSchema,
  siteSettingsSchema,
  navigationSettingsSchema,
  footerSettingsSchema,
  newsletterSettingsSchema,
  themeSettingsSchema,
  migrationStateSchema,
];
