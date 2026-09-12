import { RESERVED_SLUGS } from '@blog/config/constants';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { seoField } from '@blog/studio/schema-types/helpers/seo-field';
import { slugField } from '@blog/studio/schema-types/helpers/slug-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/module-post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import { FileText } from 'lucide-react';
import { defineType } from 'sanity';

const landingSlugUrlPreviewInput = createSlugUrlPreviewInput('/');

export const landingSchema = defineType({
  name: 'page_landing',
  title: 'Landing Page',
  type: 'document',
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
    headingBlockField({
      requireHeading: true,
      description:
        "The page heading, shown as the page's H1. Hidden when a hero is set — the hero's heading becomes the H1 instead. Still required, so the page keeps a heading if the hero is ever removed.",
    }),
    heroField(),
    defineModulesField({
      allow: [
        contentSchema.name,
        ctaSchema.name,
        postLatestSchema.name,
        postFeaturedSchema.name,
        newsletterSchema.name,
        taxonomyListSchema.name,
      ],
      validateCustom: (rule) =>
        rule
          .custom(
            validateSingleBlankHeadingPerType([
              postLatestSchema.name,
              postFeaturedSchema.name,
            ]),
          )
          .custom(validateTaxonomyListHasTaxonomy),
    }),
    seoField(),
  ],
});
