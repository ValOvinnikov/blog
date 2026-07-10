import { Settings } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: Settings,
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      description:
        'Used in the browser tab, RSS feed, and as the default SEO title prefix.',
      validation: (rule) => rule.required().max(60),
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
      name: 'logo',
      title: 'Logo',
      type: 'imageWithAlt',
      description:
        'Site logo shown in the header. SVG or high-res PNG recommended.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'brandPrefix',
      title: 'Brand Prefix',
      type: 'string',
      description:
        'Primary brand text shown in the site header logo, e.g. "val".',
      validation: (rule) => rule.required().max(30),
    }),
    defineField({
      name: 'brandSuffix',
      title: 'Brand Suffix',
      type: 'string',
      description:
        'Accent suffix shown after the brand prefix in the site header logo, e.g. ".dev".',
      validation: (rule) => rule.max(30),
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
    defineField({
      name: 'navigation',
      title: 'Navigation',
      type: 'array',
      description: 'Top-level nav links rendered in the site header.',
      of: [defineArrayMember({ type: 'navItem' })],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      description: 'Social profile links shown in the site footer.',
      of: [defineArrayMember({ type: 'socialLink' })],
    }),
  ],
});
