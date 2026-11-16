import { languageField } from '@shinefold/studio/schema-types/fields/language-field/language-field';
import { templateField } from '@shinefold/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { pageHeadingBlockField } from '@shinefold/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@shinefold/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@shinefold/studio/schema-types/preview/language-preview/language-preview';
import { validateOnePerLanguage } from '@shinefold/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import type { ComponentType } from 'react';
import { defineType } from 'sanity';

type TIndexPageOptions = {
  name: string;
  title: string;
  description: string;
  icon: ComponentType;
  templateType: string;
};

export const indexPage = ({
  name,
  title,
  description,
  icon,
  templateType,
}: TIndexPageOptions) =>
  defineType({
    name,
    title,
    type: 'document',
    description,
    icon,
    preview: languagePreview,
    validation: (rule) => rule.custom(validateOnePerLanguage),
    fields: [
      languageField(),
      titleField(),
      ...pageHeadingBlockField(),
      templateField({ type: templateType }),
      seoField(),
    ],
  });
