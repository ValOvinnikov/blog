import type { TTaxonomyKind } from '@blog/config/constants';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import {
  pageHeadingAlignmentFields,
  pageHeadingBlockField,
} from '@blog/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@blog/studio/schema-types/preview/language-preview/language-preview';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind';
import type { ComponentType } from 'react';
import { defineField, defineType } from 'sanity';

type TTaxonomyIndexPageOptions = {
  name: string;
  title: string;
  description: string;
  icon: ComponentType;
  kind: TTaxonomyKind;
  taxonomyKindMismatchError: string;
  templateType: string;
};

export const taxonomyIndexPage = ({
  name,
  title,
  description,
  icon,
  kind,
  taxonomyKindMismatchError,
  templateType,
}: TTaxonomyIndexPageOptions) =>
  defineType({
    name,
    title,
    type: 'document',
    description,
    icon,
    validation: (rule) => [
      rule.custom(validateOnePerLanguage),
      rule.custom(
        validateTaxonomyListReferencesMatchKind(
          kind,
          taxonomyListSchema.name,
          taxonomyKindMismatchError,
        ),
      ),
    ],
    preview: languagePreview,
    fields: [
      languageField(),
      titleField(),
      pageHeadingBlockField(),
      ...pageHeadingAlignmentFields(),
      templateField({ type: templateType }),
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
