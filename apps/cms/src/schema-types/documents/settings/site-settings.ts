import { titleField } from '@cms/schema-types/helpers/title-field';
import { brandSchema } from '@cms/schema-types/objects/brand';
import { imageWithAltSchema } from '@cms/schema-types/objects/image-with-alt';
import { Settings } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const siteSchema = defineType({
  name: 'settings_site',
  title: 'Site Settings',
  type: 'document',
  icon: Settings,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Site settings',
    }),
  },
  fields: [
    titleField(),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: brandSchema.name,
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
      name: 'defaultOgImage',
      title: 'Default OG Image',
      type: imageWithAltSchema.name,
      description:
        'Fallback social-sharing image used when a page has no own OG image.',
      validation: (rule) => rule.required(),
    }),
  ],
});
