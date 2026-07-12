import { defineArrayMember, defineField } from 'sanity';

/**
 * Builds the `modules` reference array field shared by every page document.
 * Each page passes the subset of module schema `.name` values it allows, so
 * adding a module type to a page is a one-line change instead of a
 * duplicated field block.
 *
 * `allow` is typed `string[]` rather than a module-type union: `defineType(...)`
 * widens `.name` to `string`, so callers pass e.g. `postListSchema.name` /
 * `ctaSchema.name` directly. Sanity validates the referenced type names exist
 * at `schema extract` time regardless.
 */
export const defineModulesField = ({
  allow,
  description,
}: {
  allow: string[];
  description?: string;
}) =>
  defineField({
    name: 'modules',
    title: 'Modules',
    type: 'array',
    description: description ?? 'Ordered content modules that build this page.',
    of: allow.map((type) =>
      defineArrayMember({ name: type, type: 'reference', to: [{ type }] }),
    ),
  });
