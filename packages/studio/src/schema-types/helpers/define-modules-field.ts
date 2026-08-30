import { defineArrayMember, defineField, type ArrayRule } from 'sanity';

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
 *
 * `validateCustom`, when given, receives the rule after `.unique().error(...)`
 * and returns it further chained — for page-specific constraints across the
 * whole array (e.g. home-page's blank-heading check) without every caller
 * paying for it.
 */
export const defineModulesField = ({
  allow,
  description,
  validateCustom,
}: {
  allow: string[];
  description?: string;
  validateCustom?: (rule: ArrayRule<unknown[]>) => ArrayRule<unknown[]>;
}) =>
  defineField({
    name: 'modules',
    title: 'Modules',
    type: 'array',
    description: description ?? 'Ordered content modules that build this page.',
    of: allow.map((type) =>
      defineArrayMember({ name: type, type: 'reference', to: [{ type }] }),
    ),
    validation: (rule) => {
      // `unique()` compares array items by `_ref` for reference-typed array
      // members, so this rejects the same module document being referenced
      // twice in one page. That guarantee is what makes a module's `_id`
      // safe to use as a React key downstream in the web app.
      const uniqueRule = rule
        .unique()
        .error('Each module can only be referenced once per page.');

      return validateCustom ? validateCustom(uniqueRule) : uniqueRule;
    },
  });
