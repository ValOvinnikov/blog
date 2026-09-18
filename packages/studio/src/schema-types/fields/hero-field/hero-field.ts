import { defineField } from 'sanity';

/**
 * Builds the `hero` reference field shared by every hero-capable page.
 * Each page passes the subset of hero schema `.name` values it allows, so
 * scoping which hero kinds a page can pick is a one-line change instead of
 * every page offering the whole hero family.
 *
 * `allow` is typed `string[]` rather than a hero-type union: `defineType(...)`
 * widens `.name` to `string`, so callers pass e.g. `heroBlogSchema.name` /
 * `heroStatementSchema.name` directly. Sanity validates the referenced type
 * names exist at `schema extract` time regardless.
 */
export const heroField = ({ allow }: { allow: string[] }) =>
  defineField({
    name: 'hero',
    title: 'Hero',
    type: 'reference',
    description: "Optional. Replaces the page's heading and owns the h1.",
    to: allow.map((type) => ({ type })),
  });
