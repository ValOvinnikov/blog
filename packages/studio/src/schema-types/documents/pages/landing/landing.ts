import { RESERVED_SLUGS } from '@blog/config/constants';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/post-featured/post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { validateHeroOrHeading } from '@blog/studio/schema-types/validation/validate-hero-or-heading/validate-hero-or-heading';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/validation/validate-single-blank-heading-per-type/validate-single-blank-heading-per-type';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/validation/validate-taxonomy-list-has-taxonomy/validate-taxonomy-list-has-taxonomy';
import { FileText } from 'lucide-react';
import { defineType } from 'sanity';

const landingSlugUrlPreviewInput = createSlugUrlPreviewInput('/');

export const landingPageSchema = defineType({
  name: 'page_landing',
  title: 'Landing Page',
  type: 'document',
  icon: FileText,
  validation: validateHeroOrHeading(),
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
      description:
        'The page heading (h1) and its optional supporting line. Not shown when a hero is set.',
    }),
    heroField(),
    modulesField({
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
