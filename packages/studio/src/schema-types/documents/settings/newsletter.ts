import { newsletterContentFields } from '@blog/studio/schema-types/helpers/newsletter-content-fields';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { Mail } from 'lucide-react';
import { defineField, defineType } from 'sanity';

/**
 * Site-wide newsletter signup copy, authored once and reused wherever the
 * newsletter form renders (the Blog page's `module_newsletter` full variant
 * and the per-post compact variant on post pages).
 */
export const newsletterSettingsSchema = defineType({
  name: 'settings_newsletter',
  title: 'Newsletter',
  type: 'document',
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
        'Up to 2 short reassurance phrases shown under the newsletter signup form (e.g. "No spam", "Unsubscribe anytime").',
      of: [{ type: 'string', validation: (rule) => rule.max(40) }],
      validation: (rule) => rule.max(2),
    }),
  ],
});
