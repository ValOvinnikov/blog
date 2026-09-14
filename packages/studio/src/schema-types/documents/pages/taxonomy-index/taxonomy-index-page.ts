import type { TTaxonomyKind } from '@blog/config/constants';
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
import type { ComponentType } from 'react';
import { defineField, defineType } from 'sanity';

type TTaxonomyIndexPageOptions = {
  name: string;
  title: string;
  description: string;
  icon: ComponentType;
  kind: TTaxonomyKind;
  noTaxonomyListWarning: string;
  taxonomyKindMismatchError: string;
  previewSubtitle: string;
};

/**
 * Shared body for the tag-index and topic-index singletons, which differ
 * only in which taxonomy kind they list and the copy naming it.
 */
export const taxonomyIndexPage = ({
  name,
  title,
  description,
  icon,
  kind,
  noTaxonomyListWarning,
  taxonomyKindMismatchError,
  previewSubtitle,
}: TTaxonomyIndexPageOptions) =>
  defineType({
    name,
    title,
    type: 'document',
    description,
    icon,
    validation: (rule) => [
      rule.custom(validateSingleTaxonomyListModule),
      rule
        .custom(validateHasTaxonomyListModule(noTaxonomyListWarning))
        .warning(),
      rule.custom(
        validateTaxonomyListReferencesMatchKind(
          kind,
          taxonomyListSchema.name,
          taxonomyKindMismatchError,
        ),
      ),
    ],
    preview: {
      select: {
        title: 'title',
      },
      prepare({ title: pageTitle }) {
        return {
          title: pageTitle ?? 'Unknown',
          subtitle: previewSubtitle,
        };
      },
    },
    fields: [
      titleField(),
      headingBlockField({
        requireHeading: true,
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
