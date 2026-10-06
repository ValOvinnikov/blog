import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { landingTemplateSchema } from '@blog/studio/schema-types/documents/templates/landing/landing';
import {
  LANGUAGE_FIELD,
  languageField,
} from '@blog/studio/schema-types/fields/language-field/language-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { LandingSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/landing-slug-url-preview/landing-slug-url-preview-input';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@blog/studio/schema-types/preview/language-preview/language-preview';
import { validateLandingParent } from '@blog/studio/schema-types/validation/validate-landing-parent/validate-landing-parent';
import { validateLandingSlug } from '@blog/studio/schema-types/validation/validate-landing-slug/validate-landing-slug';
import { validateLandingSlugUniqueAmongSiblings } from '@blog/studio/schema-types/validation/validate-landing-slug-unique-among-siblings/validate-landing-slug-unique-among-siblings';
import { FileText } from 'lucide-react';
import {
  defineField,
  defineType,
  getDraftId,
  getPublishedId,
  type ReferenceFilterResolver,
} from 'sanity';

const otherPageInSameLanguage: ReferenceFilterResolver = ({ document }) => {
  const language = document[LANGUAGE_FIELD];

  return {
    filter: `coalesce(${LANGUAGE_FIELD}, "") == $language && !(_id in [$id, $draftId])`,
    params: {
      language: typeof language === 'string' ? language : '',
      id: getPublishedId(document._id),
      draftId: getDraftId(document._id),
    },
  };
};

export const landingPageSchema = defineType({
  name: PAGE_LANDING_TYPE,
  title: 'Landing Page',
  type: 'document',
  description:
    'A standalone page at its own URL, showing the hero and modules of its template — for marketing or informational content.',
  icon: FileText,
  preview: languagePreview,
  fields: [
    languageField(),
    titleField(),
    defineField({
      name: 'parent',
      title: 'Parent Page',
      type: 'reference',
      to: [{ type: PAGE_LANDING_TYPE }],
      description:
        'The page this one sits under, e.g. Modules for /modules/faq. Leave empty for a top-level page.',
      options: { filter: otherPageInSameLanguage, disableNew: true },
      validation: (rule) => rule.custom(validateLandingParent),
    }),
    slugField({
      description:
        'The last part of the URL — auto-generated from title. To nest this page, choose a parent page instead.',
      previewInput: LandingSlugUrlPreviewInput,
      isUnique: validateLandingSlugUniqueAmongSiblings,
      validateSlug: validateLandingSlug,
    }),
    headingBlockField(),
    templateField({ type: landingTemplateSchema.name }),
    seoField(),
  ],
});
