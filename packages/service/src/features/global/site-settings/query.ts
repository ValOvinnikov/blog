import { q } from '#/sanity/query';

export const siteSettingsQuery = q.star
  .filterByType('siteSettings')
  .project({
    title: true,
    description: true,
    tagline: true,
    logo: true,
    ogImage: true,
    navigation: true,
    socialLinks: true,
  })
  .slice(0);
