import { heroField } from '@shinefold/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@shinefold/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { contactFormSchema } from '@shinefold/studio/schema-types/modules/contact-form/contact-form';
import { contentSchema } from '@shinefold/studio/schema-types/modules/content/content';
import { cookieSettingsSchema } from '@shinefold/studio/schema-types/modules/cookie-settings/cookie-settings';
import { embedSchema } from '@shinefold/studio/schema-types/modules/embed/embed';
import { faqSchema } from '@shinefold/studio/schema-types/modules/faq/faq';
import { featureHighlightsSchema } from '@shinefold/studio/schema-types/modules/feature-highlights/feature-highlights';
import { featureListSchema } from '@shinefold/studio/schema-types/modules/feature-list/feature-list';
import { heroBlogSchema } from '@shinefold/studio/schema-types/modules/hero-blog/hero-blog';
import { heroProfileSchema } from '@shinefold/studio/schema-types/modules/hero-profile/hero-profile';
import { heroStatementSchema } from '@shinefold/studio/schema-types/modules/hero-statement/hero-statement';
import { logoWallSchema } from '@shinefold/studio/schema-types/modules/logo-wall/logo-wall';
import { postFeaturedSchema } from '@shinefold/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@shinefold/studio/schema-types/modules/post-latest/post-latest';
import { pricingSchema } from '@shinefold/studio/schema-types/modules/pricing/pricing';
import { sectionPagesSchema } from '@shinefold/studio/schema-types/modules/section-pages/section-pages';
import { statsSchema } from '@shinefold/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@shinefold/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { teamSchema } from '@shinefold/studio/schema-types/modules/team/team';
import { testimonialSchema } from '@shinefold/studio/schema-types/modules/testimonial/testimonial';
import { timelineSchema } from '@shinefold/studio/schema-types/modules/timeline/timeline';
import type { ComponentType } from 'react';
import { defineType } from 'sanity';

type TLandingLayoutTemplateOptions = {
  name: string;
  title: string;
  description: string;
  icon: ComponentType;
};

export const landingLayoutTemplate = ({
  name,
  title,
  description,
  icon,
}: TLandingLayoutTemplateOptions) =>
  defineType({
    name,
    title,
    type: 'document',
    description,
    icon,
    preview: {
      select: { title: 'title' },
    },
    fields: [
      titleField(),
      heroField({
        allow: [
          heroBlogSchema.name,
          heroStatementSchema.name,
          heroProfileSchema.name,
        ],
      }),
      modulesField({
        extend: [
          contentSchema.name,
          postLatestSchema.name,
          postFeaturedSchema.name,
          taxonomyListSchema.name,
          featureListSchema.name,
          featureHighlightsSchema.name,
          logoWallSchema.name,
          testimonialSchema.name,
          teamSchema.name,
          statsSchema.name,
          timelineSchema.name,
          faqSchema.name,
          embedSchema.name,
          pricingSchema.name,
          contactFormSchema.name,
          cookieSettingsSchema.name,
          sectionPagesSchema.name,
        ],
      }),
    ],
  });
