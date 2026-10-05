import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { ShieldCheck } from 'lucide-react';
import { defineType } from 'sanity';

const TEXT_MAX_LENGTH = 40;

export const newsletterTrustCueSchema = defineType({
  name: 'newsletterTrustCue',
  title: 'Trust Cue',
  type: 'object',
  description: 'A short reassurance shown under the signup form.',
  icon: ShieldCheck,
  fields: [
    localizedOneLineTextField({
      name: 'text',
      title: 'Text',
      description: 'For example "No spam" or "Unsubscribe anytime".',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            TEXT_MAX_LENGTH,
            `Keep each trust cue under ${TEXT_MAX_LENGTH} characters.`,
          ),
        ),
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare({ text }) {
      return { title: defaultLanguageValue(text) };
    },
  },
});
