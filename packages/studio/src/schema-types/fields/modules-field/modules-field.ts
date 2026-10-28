import { entitledModuleFilter } from '@blog/studio/schema-types/filters/entitled-module';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import {
  modulePath,
  type TModuleReference,
} from '@blog/studio/schema-types/validation/module-path/module-path';
import { validateModulesEntitled } from '@blog/studio/schema-types/validation/validate-modules-entitled/validate-modules-entitled';
import {
  moduleInsertMenuGroups,
  sortModulesByKind,
} from '@blog/studio/structure/module-kinds/module-kinds';
import { defineArrayMember, defineField } from 'sanity';

const ONCE_ERROR = 'Only one module of this type is allowed per page.';

const DEFAULT_MODULES = [ctaSchema.name, newsletterSchema.name];

export const modulesField = ({
  extend = [],
  description,
  once,
}: {
  extend?: string[];
  description?: string;
  once?: string[];
}) => {
  const allow = sortModulesByKind([...DEFAULT_MODULES, ...extend]);

  return defineField({
    name: 'modules',
    title: 'Modules',
    type: 'array',
    description: description ?? 'Ordered content modules that build this page.',
    of: allow.map((type) =>
      defineArrayMember({
        name: type,
        type: 'reference',
        to: [{ type }],
        options: { filter: entitledModuleFilter },
      }),
    ),
    options: { insertMenu: { groups: moduleInsertMenuGroups(allow) } },
    validation: (rule) => {
      // `unique()` compares array items by `_ref` for reference-typed array
      // members, so this rejects the same module document being referenced
      // twice in one page. That guarantee is what makes a module's `_id`
      // safe to use as a React key downstream in the web app.
      const uniqueRule = rule
        .unique()
        .error('Each module can only be referenced once per page.');
      const entitledRule = rule.custom(validateModulesEntitled).warning();

      if (!once) return [uniqueRule, entitledRule];

      const onceRule = uniqueRule.custom((modules) => {
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

      return [onceRule, entitledRule];
    },
  });
};
