import { authorSchema } from './blog/author';
import { postSchema } from './blog/post';
import { tagSchema } from './blog/tag';
import { topicSchema } from './blog/topic';
import { blogPageSchema } from './pages/blog-page';
import { homePageSchema } from './pages/home-page';
import { genericSchema } from './pages/page';
import { pagePostSchema } from './pages/page-post';
import { pageTopicSchema } from './pages/page-topic';
import { tagIndexPageSchema } from './pages/tag-index-page';
import { topicIndexPageSchema } from './pages/topic-index-page';
import { footerSchema } from './settings/footer';
import { navigationSchema } from './settings/navigation';
import { newsletterSettingsSchema } from './settings/newsletter';
import { siteSchema } from './settings/site-settings';
import { themeSchema } from './settings/theme';
import { voiceSchema } from './settings/voice';

export const documents = [
  postSchema,
  authorSchema,
  topicSchema,
  tagSchema,
  genericSchema,
  homePageSchema,
  blogPageSchema,
  topicIndexPageSchema,
  pageTopicSchema,
  pagePostSchema,
  tagIndexPageSchema,
  siteSchema,
  navigationSchema,
  footerSchema,
  newsletterSettingsSchema,
  themeSchema,
  voiceSchema,
];
