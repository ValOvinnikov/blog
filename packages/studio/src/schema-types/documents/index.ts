import { faqBlockSchema } from './blocks/faq/faq';
import { featureBlockSchema } from './blocks/feature/feature';
import { blockTestimonialSchema } from './blocks/testimonial/testimonial';
import { tagSchema } from './blog/tag/tag';
import { topicSchema } from './blog/topic/topic';
import { linkSchema } from './link/link';
import { homePageSchema } from './pages/home/home';
import { landingPageSchema } from './pages/landing/landing';
import { postPageSchema } from './pages/post/post';
import { postIndexPageSchema } from './pages/post-index/post-index';
import { tagPageSchema } from './pages/tag/tag';
import { tagIndexPageSchema } from './pages/tag-index/tag-index';
import { topicPageSchema } from './pages/topic/topic';
import { topicIndexPageSchema } from './pages/topic-index/topic-index';
import { personSchema } from './person/person';
import { redirectSchema } from './redirect/redirect';
import { footerSettingsSchema } from './settings/footer/footer';
import { navigationSettingsSchema } from './settings/navigation/navigation';
import { siteSettingsSchema } from './settings/site-settings/site-settings';
import { themeSettingsSchema } from './settings/theme/theme';
import { migrationStateSchema } from './system/migration-state/migration-state';
import { homeTemplateSchema } from './templates/home/home';
import { landingTemplateSchema } from './templates/landing/landing';
import { postIndexTemplateSchema } from './templates/post-index/post-index';
import { tagTemplateSchema } from './templates/tag/tag';
import { tagIndexTemplateSchema } from './templates/tag-index/tag-index';
import { topicTemplateSchema } from './templates/topic/topic';
import { topicIndexTemplateSchema } from './templates/topic-index/topic-index';

export const documents = [
  personSchema,
  topicSchema,
  tagSchema,
  featureBlockSchema,
  blockTestimonialSchema,
  faqBlockSchema,
  linkSchema,
  homeTemplateSchema,
  landingTemplateSchema,
  postIndexTemplateSchema,
  topicIndexTemplateSchema,
  topicTemplateSchema,
  tagIndexTemplateSchema,
  tagTemplateSchema,
  landingPageSchema,
  homePageSchema,
  postIndexPageSchema,
  topicIndexPageSchema,
  topicPageSchema,
  postPageSchema,
  tagIndexPageSchema,
  tagPageSchema,
  redirectSchema,
  siteSettingsSchema,
  navigationSettingsSchema,
  footerSettingsSchema,
  themeSettingsSchema,
  migrationStateSchema,
];
