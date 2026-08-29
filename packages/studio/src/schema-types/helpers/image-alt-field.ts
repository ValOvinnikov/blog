import { defineField } from 'sanity';

/**
 * Shared `hotspot` option for any `type: 'image'` schema — enables the
 * crop/hotspot editor in the Studio.
 */
export const imageHotspotOptions = { hotspot: true } as const;

/**
 * Shared `alt` field for any image-based schema type. Required for
 * accessibility (screen readers) and SEO — every image consumer (hero,
 * avatar, brand logo, Open Graph image, body images, ...) composes this
 * instead of redefining it.
 */
export const imageAltField = () =>
  defineField({
    name: 'alt',
    title: 'Alternative Text',
    type: 'string',
    description: 'Describe the image for screen readers and search engines.',
    validation: (rule) => rule.required(),
  });
