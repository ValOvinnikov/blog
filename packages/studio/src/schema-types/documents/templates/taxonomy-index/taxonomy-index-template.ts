import type { TTaxonomyKind } from '@blog/config/constants';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { validateTaxonomyListReferencesMatchKind } from '@blog/studio/schema-types/validation/validate-taxonomy-list-matches-kind/validate-taxonomy-list-matches-kind';
import type { ComponentType } from 'react';
import { defineType } from 'sanity';

type TTaxonomyIndexTemplateOptions = {
  name: string;
  title: string;
  description: string;
  icon: ComponentType;
  kind: TTaxonomyKind;
  taxonomyKindMismatchError: string;
};

export const taxonomyIndexTemplate = ({
  name,
  title,
  description,
  icon,
  kind,
  taxonomyKindMismatchError,
}: TTaxonomyIndexTemplateOptions) =>
  defineType({
    name,
    title,
    type: 'document',
    description,
    icon,
    validation: (rule) =>
      rule.custom(
        validateTaxonomyListReferencesMatchKind(
          kind,
          taxonomyListSchema.name,
          taxonomyKindMismatchError,
        ),
      ),
    preview: {
      select: { title: 'title' },
    },
    fields: [
      titleField(),
      heroField({ allow: [heroBlogSchema.name] }),
      modulesField({
        extend: [
          taxonomyListSchema.name,
          postLatestSchema.name,
          contentSchema.name,
        ],
        once: [taxonomyListSchema.name],
      }),
    ],
  });
