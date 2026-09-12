import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { brandSchema } from '@blog/studio/schema-types/objects/brand/brand';
import { Settings } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const siteSettingsSchema = defineType({
  name: 'settings_site',
  title: 'Site Settings',
  type: 'document',
  description:
    'Site-wide identity and default SEO copy used across every page.',
  icon: Settings,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Site settings',
    }),
  },
  fieldsets: [
    {
      name: 'seo',
      title: 'SEO',
      description:
        'Site-wide SEO and social defaults, used when a page does not set its own.',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    titleField(),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: brandSchema.name,
      description:
        "The site's identity — name, logo, and optional status line — used across the header and footer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      description: 'Default meta description for the home page and RSS feed.',
      validation: (rule) => rule.required().min(50).max(160),
      fieldset: 'seo',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short strapline shown in the site header or hero.',
      validation: (rule) => rule.max(120),
      fieldset: 'seo',
    }),
  ],
});
