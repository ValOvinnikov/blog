import type { TLocaleIsoCode } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import {
  LANGUAGE_FIELD,
  languageField,
} from '@blog/studio/schema-types/fields/language-field/language-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { featureHighlightsSchema } from '@blog/studio/schema-types/modules/feature-highlights/feature-highlights';
import { featureListSchema } from '@blog/studio/schema-types/modules/feature-list/feature-list';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { heroProfileSchema } from '@blog/studio/schema-types/modules/hero-profile/hero-profile';
import { heroStatementSchema } from '@blog/studio/schema-types/modules/hero-statement/hero-statement';
import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { pricingSchema } from '@blog/studio/schema-types/modules/pricing/pricing';
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { teamSchema } from '@blog/studio/schema-types/modules/team/team';
import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';
import { timelineSchema } from '@blog/studio/schema-types/modules/timeline/timeline';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { House } from 'lucide-react';
import { defineType } from 'sanity';

export const homePageSchema = defineType({
  name: PAGE_HOME_TYPE,
  title: 'Home Page',
  type: 'document',
  description:
    'The home page — the first thing readers see, built from a hero, a heading, and a stack of modules.',
  icon: House,
  preview: {
    select: {
      title: 'title',
      language: LANGUAGE_FIELD,
    },
    prepare: ({
      title,
      language,
    }: {
      title?: string;
      language?: TLocaleIsoCode;
    }) => ({
      title: title ?? 'Unknown',
      subtitle: language ? LOCALE_LABEL[language] : undefined,
    }),
  },
  validation: (rule) => rule.custom(validateOnePerLanguage),
  fields: [
    languageField(),
    titleField(),
    headingBlockField(),
    heroField({
      allow: [
        heroBlogSchema.name,
        heroStatementSchema.name,
        heroProfileSchema.name,
      ],
    }),
    modulesField({
      allow: [
        contentSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        postLatestSchema.name,
        taxonomyListSchema.name,
        postFeaturedSchema.name,
        featureListSchema.name,
        featureHighlightsSchema.name,
        logoWallSchema.name,
        testimonialSchema.name,
        teamSchema.name,
        statsSchema.name,
        timelineSchema.name,
        faqSchema.name,
        pricingSchema.name,
      ],
    }),
    seoField(),
  ],
});
