import { RESERVED_SLUGS } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
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
import { statsSchema } from '@blog/studio/schema-types/modules/stats/stats';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { teamSchema } from '@blog/studio/schema-types/modules/team/team';
import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';
import { timelineSchema } from '@blog/studio/schema-types/modules/timeline/timeline';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { FileText } from 'lucide-react';
import { defineType } from 'sanity';

const landingSlugUrlPreviewInput = createSlugUrlPreviewInput('/');

export const landingPageSchema = defineType({
  name: PAGE_LANDING_TYPE,
  title: 'Landing Page',
  type: 'document',
  description:
    'A standalone page built from modules, used for marketing or informational content at its own URL.',
  icon: FileText,
  preview: {
    select: {
      title: 'title',
    },
  },
  fields: [
    titleField(),
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: landingSlugUrlPreviewInput,
      validateSlug: (value) => {
        const current = value?.current;

        if (
          current &&
          (RESERVED_SLUGS as readonly string[]).includes(current)
        ) {
          return `"${current}" is a reserved path and can't be used as a page slug.`;
        }

        return true;
      },
    }),
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
        postLatestSchema.name,
        postFeaturedSchema.name,
        newsletterSchema.name,
        taxonomyListSchema.name,
        featureListSchema.name,
        featureHighlightsSchema.name,
        logoWallSchema.name,
        testimonialSchema.name,
        teamSchema.name,
        statsSchema.name,
        timelineSchema.name,
        faqSchema.name,
      ],
    }),
    seoField(),
  ],
});
