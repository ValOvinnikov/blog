import { newsletterContentFields } from '@cms/schema-types/helpers/newsletter-content-fields';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { Mail } from 'lucide-react';
import { defineType } from 'sanity';

/**
 * Site-wide newsletter copy — the CMS-authored source of the newsletter
 * signup's heading/description wherever it's rendered (the Blog page's
 * `module_newsletter` full variant and the per-post compact variant on post
 * pages). Fields mirror `module_newsletter` (`../../modules/module-newsletter.ts`).
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
  fields: [titleField(), ...newsletterContentFields()],
});
