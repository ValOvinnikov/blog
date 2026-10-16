import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { localizedParagraphTextField } from '@blog/studio/schema-types/fields/localized-paragraph-text-field/localized-paragraph-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { MessageSquare } from 'lucide-react';
import { defineType } from 'sanity';

const SUCCESS_MESSAGE_MAX_LENGTH = 160;

export const contactFormSchema = defineType({
  name: 'module_contactForm',
  title: 'Contact Form',
  type: 'document',
  description:
    'A section where readers send you a message, with a heading and a name, email and message form.',
  icon: MessageSquare,
  fields: [
    titleField(),
    brandVariantField(),
    moduleHeadingBlockField(),
    localizedOneLineTextField({
      name: 'successMessage',
      title: 'Success Message',
      description:
        "Shown in place of the form once a message is sent. Say when you'll reply.",
      validation: (rule) => [
        rule.custom(
          validateDefaultLanguageFilled(
            'Add the message readers see once sent.',
          ),
        ),
        rule.custom(
          validateLocalizedMaxLength(
            SUCCESS_MESSAGE_MAX_LENGTH,
            `Keep the success message under ${SUCCESS_MESSAGE_MAX_LENGTH} characters.`,
          ),
        ),
      ],
    }),
    localizedParagraphTextField({
      name: 'privacyNote',
      title: 'Privacy Note',
      description:
        'One line under the send button, with a link to your privacy page.',
    }),
    ...alignmentFields([], { alignsItems: true }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
    },
    prepare({ title, brandVariant }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(brandVariant),
      };
    },
  },
});
