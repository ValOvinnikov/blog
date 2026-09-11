import { TAXONOMY_KIND } from '@blog/config/constants';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { seoField } from '@blog/studio/schema-types/helpers/seo-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateHeroOrHeading } from '@blog/studio/schema-types/helpers/validate-hero-or-heading';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-matches-kind';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import { Tag } from 'lucide-react';
import { defineField, defineType, type SanityDocument } from 'sanity';

const MULTIPLE_TAXONOMY_LIST_ERROR =
  'Only one Taxonomy List module is allowed per page.';
const NO_TAXONOMY_LIST_WARNING =
  'This page has no Taxonomy List module — the tag list will be empty until one is added.';
const TAXONOMY_KIND_MISMATCH_ERROR =
  'This page lists tags; the module is set to topics.';

type TModuleReference = { _type?: string; _ref?: string };
type TTagIndexPageDocument = { modules?: TModuleReference[] };

const getTaxonomyListModuleRefs = (
  document: SanityDocument | undefined,
): string[] =>
  ((document as TTagIndexPageDocument | undefined)?.modules ?? [])
    .filter((module) => module._type === taxonomyListSchema.name)
    .map((module) => module._ref)
    .filter((ref): ref is string => Boolean(ref));

const validateSingleTaxonomyListModule = (
  document: SanityDocument | undefined,
): string | true =>
  getTaxonomyListModuleRefs(document).length > 1
    ? MULTIPLE_TAXONOMY_LIST_ERROR
    : true;

const validateHasTaxonomyListModule = (
  document: SanityDocument | undefined,
): string | true =>
  getTaxonomyListModuleRefs(document).length === 0
    ? NO_TAXONOMY_LIST_WARNING
    : true;

export const tagIndexPageSchema = defineType({
  name: 'page_tagIndex',
  title: 'Tag Index Page',
  type: 'document',
  icon: Tag,
  validation: (rule) => [
    ...validateHeroOrHeading()(rule),
    rule.custom(validateSingleTaxonomyListModule),
    rule.custom(validateHasTaxonomyListModule).warning(),
    rule.custom(
      validateTaxonomyListReferencesMatchKind(
        TAXONOMY_KIND.TAGS,
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
        subtitle: 'Tag index singleton',
      };
    },
  },
  fields: [
    titleField(),
    headingBlockField({
      description:
        'The page heading (h1) and its optional supporting line. Not shown when a hero is set.',
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
