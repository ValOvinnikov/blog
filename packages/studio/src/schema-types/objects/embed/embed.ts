import { embedUrlField } from '@blog/studio/schema-types/fields/embed-url-field/embed-url-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { SquarePlay } from 'lucide-react';
import { defineType } from 'sanity';

export const embedObjectSchema = defineType({
  name: 'embed',
  title: 'Embed',
  type: 'object',
  description:
    'A video, booking calendar or map from another site, shown in a frame once the visitor allows external media.',
  icon: SquarePlay,
  fields: [
    embedUrlField(),
    localizedOneLineTextField({
      name: 'title',
      title: 'Title',
      description:
        'What the embed shows, in a few words. Screen readers announce it, and it heads the placeholder shown before the visitor allows external media.',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled('Add a title.')),
    }),
    localizedOneLineTextField({
      name: 'caption',
      title: 'Caption',
      description: 'Optional line shown under the frame.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      url: 'url',
    },
    prepare({ title, url }: { title?: unknown; url?: string }) {
      return {
        title: defaultLanguageValue(title) ?? 'Untitled embed',
        subtitle: url,
      };
    },
  },
});
