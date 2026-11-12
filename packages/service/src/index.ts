import { createSkimService } from './features/editorial/skim';
import { createModulesService } from './features/entities/modules';
import { createPostsService } from './features/entities/posts';
import { createTagsService } from './features/entities/tags';
import { createTopicsService } from './features/entities/topics';
import { createFooterService } from './features/global/footer';
import { createNavigationService } from './features/global/navigation';
import { createSiteSettingsService } from './features/global/site-settings';
import { createTranslationMapService } from './features/global/translation-map';
import { createContactFormModuleService } from './features/modules/contact-form';
import { createContentModuleService } from './features/modules/content';
import { createCookieSettingsModuleService } from './features/modules/cookie-settings';
import { createCtaModuleService } from './features/modules/cta';
import { createEmbedModuleService } from './features/modules/embed';
import { createFaqModuleService } from './features/modules/faq';
import { createFeatureHighlightsModuleService } from './features/modules/feature-highlights';
import { createFeatureListModuleService } from './features/modules/feature-list';
import { createHeroBlogModuleService } from './features/modules/hero-blog';
import { createHeroProfileModuleService } from './features/modules/hero-profile';
import { createHeroStatementModuleService } from './features/modules/hero-statement';
import { createLogoWallModuleService } from './features/modules/logo-wall';
import { createNewsletterModuleService } from './features/modules/newsletter';
import { createPostFeaturedModuleService } from './features/modules/post-featured';
import { createPostLatestModuleService } from './features/modules/post-latest';
import { createPostListModuleService } from './features/modules/post-list';
import { createPostRelatedModuleService } from './features/modules/post-related';
import { createPricingModuleService } from './features/modules/pricing';
import { createSectionPagesModuleService } from './features/modules/section-pages';
import { createStatsModuleService } from './features/modules/stats';
import { createTaxonomyListModuleService } from './features/modules/taxonomy-list';
import { createTeamModuleService } from './features/modules/team';
import { createTestimonialModuleService } from './features/modules/testimonial';
import { createTimelineModuleService } from './features/modules/timeline';
import { createPagesService } from './features/pages/service';

export const service = {
  editorial: {
    skim: createSkimService(),
  },
  pages: createPagesService(),
  modules: {
    heroBlog: createHeroBlogModuleService(),
    heroStatement: createHeroStatementModuleService(),
    heroProfile: createHeroProfileModuleService(),
    postList: createPostListModuleService(),
    postLatest: createPostLatestModuleService(),
    postFeatured: createPostFeaturedModuleService(),
    postRelated: createPostRelatedModuleService(),
    sectionPages: createSectionPagesModuleService(),
    content: createContentModuleService(),
    cta: createCtaModuleService(),
    embed: createEmbedModuleService(),
    contactForm: createContactFormModuleService(),
    cookieSettings: createCookieSettingsModuleService(),
    newsletter: createNewsletterModuleService(),
    taxonomyList: createTaxonomyListModuleService(),
    featureHighlights: createFeatureHighlightsModuleService(),
    featureList: createFeatureListModuleService(),
    logoWall: createLogoWallModuleService(),
    testimonial: createTestimonialModuleService(),
    stats: createStatsModuleService(),
    pricing: createPricingModuleService(),
    faq: createFaqModuleService(),
    team: createTeamModuleService(),
    timeline: createTimelineModuleService(),
  },
  entities: {
    topics: createTopicsService(),
    tags: createTagsService(),
    posts: createPostsService(),
    modules: createModulesService(),
  },
  global: {
    siteSettings: createSiteSettingsService(),
    navigation: createNavigationService(),
    footer: createFooterService(),
    translationMap: createTranslationMapService(),
  },
};

export type { TPostBody, TSaveSkimDraftInput } from './features/editorial/skim';
export type * from './features/entities/types';
export type * from './features/global/types';
export type * from './features/modules/types';
export type * from './features/pages/types';
export type { TPageTranslation } from './shared/localization/page-translations/to-page-translations';
export { urlForImage, urlForSanityImage } from './sanity/image/image';
export type { TImageTransformOptions } from './sanity/image/image';
export type { TSanityProjectRef } from './sanity/project-cache/project-cache';
export { getSanityImageBaseUrl } from './sanity/image/image-base-url';
export type { TTenantSanityContext } from './sanity/client/client';
export { getPlatformSanityContext } from './sanity/client/client';
export { getPlatformSanityWriteContext } from './sanity/write-client/write-client';
export type { TCtaButton } from './shared/transformers/cta/to-cta-button';
export type { TFaqPageQuestion } from './shared/transformers/faq/resolve-faqs';
export type { THeroPresentation } from './shared/transformers/hero/to-hero-presentation';
export type { TModule } from './shared/transformers/module/to-module';
export type { TModuleAppearance } from './shared/transformers/module/to-module-appearance';
export type { TPersonCard } from './shared/transformers/person/to-person-card';
export type {
  TPostCard,
  TPostCardAuthor,
  TPostCardTopic,
} from './shared/transformers/post/to-post-card';
export type { IPortableTextLinkMark, TPortableTextLink } from '@blog/config';
export type { TPortableTextBody } from './shared/transformers/portable-text/to-portable-text-body';
export type { TSeoResolved } from './shared/transformers/seo/resolve-seo';
export type { TSocialProfile } from './shared/transformers/social-profile/to-social-profile';
export type { TTag } from './shared/transformers/tag/to-tag';
export type { TTopic } from './shared/transformers/topic/to-topic';
