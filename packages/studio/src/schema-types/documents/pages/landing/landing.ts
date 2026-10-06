import {
  PAGE_LANDING_TYPE,
  SECTION_NAVIGATION_FIELD,
  SHOW_SECTION_NAVIGATION_FIELD,
} from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { landingTemplateSchema } from '@blog/studio/schema-types/documents/templates/landing/landing';
import {
  LANGUAGE_FIELD,
  languageField,
} from '@blog/studio/schema-types/fields/language-field/language-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import {
  SectionNavigationField,
  ShowSectionNavigationField,
} from '@blog/studio/schema-types/inputs/landing-section-navigation-field/landing-section-navigation-field';
import { LandingSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/landing-slug-url-preview/landing-slug-url-preview-input';
import { pageHeadingBlockField } from '@blog/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@blog/studio/schema-types/preview/language-preview/language-preview';
import { validateLandingParent } from '@blog/studio/schema-types/validation/validate-landing-parent/validate-landing-parent';
import { validateLandingSlug } from '@blog/studio/schema-types/validation/validate-landing-slug/validate-landing-slug';
import { validateLandingSlugUniqueAmongSiblings } from '@blog/studio/schema-types/validation/validate-landing-slug-unique-among-siblings/validate-landing-slug-unique-among-siblings';
import { validateSettingMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-setting-matches-default-language/validate-setting-matches-default-language';
import {
  orderRankField,
  orderRankOrdering,
} from '@sanity/orderable-document-list';
import { FileText } from 'lucide-react';
import type { ComponentType } from 'react';
import {
  defineField,
  defineType,
  type BooleanFieldProps,
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

const sectionNavigationSetting = ({
  name,
  title,
  description,
  initialValue,
  field,
}: {
  name: string;
  title: string;
  description: string;
  initialValue: boolean;
  field: ComponentType<BooleanFieldProps>;
}) =>
  defineField({
    name,
    title,
    type: 'boolean',
    description,
    initialValue,
    components: { field },
    validation: (rule) =>
      rule
        .custom(
          validateSettingMatchesDefaultLanguage({
            field: name,
            title,
            initialValue,
          }),
        )
        .warning(),
  });

export const landingPageSchema = defineType({
  name: PAGE_LANDING_TYPE,
  title: 'Landing Page',
  type: 'document',
  description:
    'A standalone page at its own URL, showing the hero and modules of its template — for marketing or informational content.',
  icon: FileText,
  preview: languagePreview,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: PAGE_LANDING_TYPE }),
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
    pageHeadingBlockField(),
    templateField({ type: landingTemplateSchema.name }),
    sectionNavigationSetting({
      name: SECTION_NAVIGATION_FIELD,
      title: 'Section navigation',
      description:
        'Shows a sidebar of this page and the pages beneath it, with breadcrumbs, on this page and every page under it.',
      initialValue: false,
      field: SectionNavigationField,
    }),
    sectionNavigationSetting({
      name: SHOW_SECTION_NAVIGATION_FIELD,
      title: 'Show section navigation on this page',
      description:
        "Turn off to hide the section's sidebar and breadcrumbs on this page only, e.g. for a page that needs the full width.",
      initialValue: true,
      field: ShowSectionNavigationField,
    }),
    seoField(),
  ],
});
