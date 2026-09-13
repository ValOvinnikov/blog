import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { Mail } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const newsletterContentFields = () => [
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'string',
    description:
      'Signup heading shown wherever the newsletter form is rendered.',
    validation: (rule) => rule.required().max(80),
  }),
  defineField({
    name: 'description',
    title: 'Description',
    type: 'text',
    description: 'Supporting copy shown under the heading.',
    validation: (rule) => rule.max(300),
  }),
];

/**
 * Site-wide newsletter signup copy, authored once and reused wherever the
 * newsletter form renders (the Blog page's `module_newsletter` full variant
 * and the per-post compact variant on post pages).
 */
export const newsletterSettingsSchema = defineType({
  name: 'settings_newsletter',
  title: 'Newsletter',
  type: 'document',
  description:
    'Shared newsletter-signup copy, reused wherever the signup form appears.',
  icon: Mail,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Newsletter settings',
    }),
  },
  fields: [
    titleField(),
    ...newsletterContentFields(),
    defineField({
      name: 'trustCues',
      title: 'Trust cues',
      type: 'array',
      description:
        'Short reassurance phrases shown under the newsletter signup form (e.g. "No spam", "Unsubscribe anytime").',
      of: [{ type: 'string', validation: (rule) => rule.max(40) }],
      validation: (rule) => rule.max(2),
    }),
  ],
});
