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
      validation: (rule) => rule.required().min(1).max(60),
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
      name: 'ogImage',
      title: 'Default OG Image',
      type: 'imageWithAlt',
      description:
        'Fallback social-share image used when a post or page has no own OG image.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ogTitle',
      title: 'Default OG Title',
      type: 'string',
      description:
        'Fallback social-share title. Defaults to site title if empty.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'ogDescription',
      title: 'Default OG Description',
      type: 'text',
      description:
        'Fallback social-share description. Defaults to site description if empty.',
      validation: (rule) => rule.max(200),
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
