import { validateEmbedUrl } from '@blog/studio/schema-types/validation/validate-embed-url/validate-embed-url';
import { defineField } from 'sanity';

export const embedUrlField = () =>
  defineField({
    name: 'url',
    title: 'URL',
    type: 'url',
    description:
      'Paste the link from YouTube, Vimeo, Loom, Cal.com, or the "Embed a map" option in Google Maps.',
    validation: (rule) => [
      rule.required(),
      rule.uri({ scheme: ['https', 'http'] }),
      rule.custom<string>(validateEmbedUrl),
    ],
  });
