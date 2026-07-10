import { Settings } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: Settings,
  fields: [
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'brand',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      description: 'Default meta description for the home page and RSS feed.',
      validation: (rule) => rule.required().min(50).max(160),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short strapline shown in the site header or hero.',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'defaultSeo',
      title: 'Default Social Sharing',
      type: 'openGraph',
      description:
        'Fallback title/description/image used when a page has no own OG values.',
      validation: (rule) =>
        rule
          .required()
          .custom((value: { ogImage?: unknown } | undefined) =>
            value?.ogImage ? true : 'A default OG image is required.',
          ),
    }),
  ],
});
