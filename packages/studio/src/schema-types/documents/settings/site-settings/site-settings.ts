import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { brandSchema } from '@blog/studio/schema-types/objects/brand/brand';
import { Settings } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const siteSettingsSchema = defineType({
  name: 'settings_site',
  title: 'Site Settings',
  type: 'document',
  description: 'Site-wide identity used across every page.',
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
      description:
        "The site's identity — name, logo, and optional status line — used across the header and footer.",
      validation: (rule) => rule.required(),
    }),
  ],
});
