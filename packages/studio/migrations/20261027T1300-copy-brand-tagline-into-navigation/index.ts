import { at, defineMigration, set } from 'sanity/migrate';

type TBrandTagline = { items?: unknown[] };

type TNavigationSettingsDoc = { tagline?: TBrandTagline };

const SITE_TAGLINE_QUERY = `*[_type == "settings_site" && !(_id in path("drafts.**"))][0].brand.tagline`;

const isFilledTagline = (tagline: unknown): tagline is TBrandTagline => {
  const items = (tagline as TBrandTagline | null | undefined)?.items;

  return Array.isArray(items) && items.length > 0;
};

export const copyBrandTaglineIntoNavigation = (
  doc: TNavigationSettingsDoc,
  siteTagline: unknown,
) =>
  isFilledTagline(doc.tagline) || !isFilledTagline(siteTagline)
    ? undefined
    : [at('tagline', set(siteTagline))];

export default defineMigration({
  title: 'Copy the Site Settings tagline into the Navigation settings',
  documentTypes: ['settings_navigation'],
  migrate: {
    async document(doc, context) {
      const siteTagline =
        await context.client.fetch<unknown>(SITE_TAGLINE_QUERY);

      return (
        copyBrandTaglineIntoNavigation(
          doc as TNavigationSettingsDoc,
          siteTagline,
        ) ?? []
      );
    },
  },
});
