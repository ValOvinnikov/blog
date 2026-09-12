import { TAXONOMY_KIND } from '@blog/config/constants';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/validation/validate-single-blank-heading-per-type/validate-single-blank-heading-per-type';
import {
  validateHasTaxonomyListModule,
  validateSingleTaxonomyListModule,
} from '@blog/studio/schema-types/validation/validate-taxonomy-list-cardinality/validate-taxonomy-list-cardinality';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/validation/validate-taxonomy-list-has-taxonomy/validate-taxonomy-list-has-taxonomy';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind';
import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const NO_TAXONOMY_LIST_WARNING =
  'This page has no Taxonomy List module — the topic list will be empty until one is added.';
const TAXONOMY_KIND_MISMATCH_ERROR =
  'This page lists topics; the module is set to tags.';

export const topicIndexPageSchema = defineType({
  name: 'page_topicIndex',
  title: 'Topic Index Page',
  type: 'document',
  description:
    'The page that lists every topic, for readers browsing by subject.',
  icon: Tags,
  validation: (rule) => [
    rule.custom(validateSingleTaxonomyListModule),
    rule
      .custom(validateHasTaxonomyListModule(NO_TAXONOMY_LIST_WARNING))
      .warning(),
    rule.custom(
      validateTaxonomyListReferencesMatchKind(
        TAXONOMY_KIND.TOPICS,
        taxonomyListSchema.name,
        TAXONOMY_KIND_MISMATCH_ERROR,
      ),
    ),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Topic index singleton',
      };
    },
  },
  fields: [
    titleField(),
    headingBlockField({
      requireHeading: true,
      description:
        "The page heading, shown as the page's H1. Hidden when a hero is set — the hero's heading becomes the H1 instead. Still required, so the page keeps a heading if the hero is ever removed.",
    }),
    heroField(),
    modulesField({
      allow: [
        taxonomyListSchema.name,
        postLatestSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
      ],
      validateCustom: (rule) =>
        rule
          .custom(validateSingleBlankHeadingPerType([postLatestSchema.name]))
          .custom(validateTaxonomyListHasTaxonomy),
    }),
    seoField(),
    defineField({
      name: 'taxonomyList',
      title: 'Taxonomy List',
      type: 'reference',
      description: 'The taxonomy list rendered on this page.',
      to: [{ type: taxonomyListSchema.name }],
      readOnly: true,
      deprecated: {
        reason:
          'Superseded by the module_taxonomyList reference now folded into modules[]. Left in place so already-deployed code keeps reading it until a follow-up migration drops it.',
      },
    }),
  ],
});
