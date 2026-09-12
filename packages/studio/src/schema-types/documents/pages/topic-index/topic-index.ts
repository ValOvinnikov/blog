import { TAXONOMY_KIND } from '@blog/config/constants';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { seoField } from '@blog/studio/schema-types/helpers/seo-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import {
  validateHasTaxonomyListModule,
  validateSingleTaxonomyListModule,
} from '@blog/studio/schema-types/helpers/validate-taxonomy-list-cardinality';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-matches-kind';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
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
    defineModulesField({
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
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The main heading shown at the top of the page.',
      readOnly: true,
      deprecated: {
        reason:
          'Superseded by headingBlock.heading. Left in place so already-deployed code keeps reading it until a follow-up migration drops it.',
      },
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      description: 'Optional line shown under the heading.',
      readOnly: true,
      deprecated: {
        reason:
          'Superseded by headingBlock.supportingText. Left in place so already-deployed code keeps reading it until a follow-up migration drops it.',
      },
    }),
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
