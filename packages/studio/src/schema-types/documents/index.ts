import { faqBlockSchema } from './blocks/faq/faq';
import { featureBlockSchema } from './blocks/feature/feature';
import { blockTestimonialSchema } from './blocks/testimonial/testimonial';
import { tagSchema } from './blog/tag/tag';
import { topicSchema } from './blog/topic/topic';
import { linkSchema } from './link/link';
import { cookieStatementPageSchema } from './pages/cookie-statement/cookie-statement';
import { homePageSchema } from './pages/home/home';
import { landingPageSchema } from './pages/landing/landing';
import { legalDocumentPageSchema } from './pages/legal-document/legal-document';
import { legalIndexPageSchema } from './pages/legal-index/legal-index';
import { postPageSchema } from './pages/post/post';
import { postIndexPageSchema } from './pages/post-index/post-index';
import { privacyDocumentPageSchema } from './pages/privacy-document/privacy-document';
import { privacyIndexPageSchema } from './pages/privacy-index/privacy-index';
import { tagPageSchema } from './pages/tag/tag';
import { tagIndexPageSchema } from './pages/tag-index/tag-index';
import { topicPageSchema } from './pages/topic/topic';
import { topicIndexPageSchema } from './pages/topic-index/topic-index';
import { personSchema } from './person/person';
import { redirectSchema } from './redirect/redirect';
import { footerSettingsSchema } from './settings/footer/footer';
import { navigationSettingsSchema } from './settings/navigation/navigation';
import { siteSettingsSchema } from './settings/site-settings/site-settings';
import { migrationStateSchema } from './system/migration-state/migration-state';
import { homeTemplateSchema } from './templates/home/home';
import { landingTemplateSchema } from './templates/landing/landing';
import { legalIndexTemplateSchema } from './templates/legal-index/legal-index';
import { postIndexTemplateSchema } from './templates/post-index/post-index';
import { privacyIndexTemplateSchema } from './templates/privacy-index/privacy-index';
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
  privacyIndexTemplateSchema,
  legalIndexTemplateSchema,
  landingPageSchema,
  homePageSchema,
  postIndexPageSchema,
  topicIndexPageSchema,
  topicPageSchema,
  postPageSchema,
  tagIndexPageSchema,
  tagPageSchema,
  privacyIndexPageSchema,
  privacyDocumentPageSchema,
  legalIndexPageSchema,
  legalDocumentPageSchema,
  cookieStatementPageSchema,
  redirectSchema,
  siteSettingsSchema,
  navigationSettingsSchema,
  footerSettingsSchema,
  migrationStateSchema,
];
