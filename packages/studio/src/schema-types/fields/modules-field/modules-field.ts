import { defineArrayMember, defineField } from 'sanity';

type TModuleReference = { _type?: string; _key?: string };

const ONCE_ERROR = 'Only one module of this type is allowed per page.';

const modulePath = (module: TModuleReference, index: number) =>
  module._key ? [{ _key: module._key }] : [index];

/**
 * `allow` is typed `string[]` rather than a module-type union: `defineType(...)`
 * widens `.name` to `string`, so callers pass e.g. `postListSchema.name` /
 * `ctaSchema.name` directly. Sanity validates the referenced type names exist
 * at `schema extract` time regardless.
 */
export const modulesField = ({
  allow,
  description,
  once,
}: {
  allow: string[];
  description?: string;
  once?: string[];
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

      if (!once) return uniqueRule;

      return uniqueRule.custom((modules) => {
        const references = (modules ?? []) as TModuleReference[];
        const counts = new Map<string, number>();

        for (const module of references) {
          if (module._type && once.includes(module._type)) {
            counts.set(module._type, (counts.get(module._type) ?? 0) + 1);
          }
        }

        const violations = references.flatMap((module, index) =>
          module._type && (counts.get(module._type) ?? 0) > 1
            ? [{ message: ONCE_ERROR, path: modulePath(module, index) }]
            : [],
        );

        return violations.length > 0 ? violations : true;
      });
    },
  });
