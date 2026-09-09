import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { sectionHeaderField } from '@blog/studio/schema-types/helpers/section-header-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateHeroOrHeading } from '@blog/studio/schema-types/helpers/validate-hero-or-heading';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postFeaturedSchema } from '@blog/studio/schema-types/modules/module-post-featured';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { House } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const homePageSchema = defineType({
  name: 'page_home',
  title: 'Home Page',
  type: 'document',
  icon: House,
  validation: validateHeroOrHeading(),
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Home singleton',
      };
    },
  },
  fields: [
    titleField(),
    sectionHeaderField({
      description:
        'The page heading (h1) and its optional supporting line. Not shown when a hero is set.',
    }),
    heroField(),
    defineModulesField({
      allow: [
        contentSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        postLatestSchema.name,
        taxonomyListSchema.name,
        postFeaturedSchema.name,
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
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Home page meta title, description, and social sharing image.',
    }),
  ],
});
