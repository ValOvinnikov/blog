import { CogIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      description:
        'Used in the browser tab, RSS feed, and as the default SEO title prefix.',
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      description: 'Default meta description for the home page and RSS feed.',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short strapline shown in the site header or hero.',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'imageWithAlt',
      description:
        'Site logo shown in the header. SVG or high-res PNG recommended.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Default OG Image',
      type: 'imageWithAlt',
      description:
        'Fallback social-share image used when a post or page has no own OG image.',
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
