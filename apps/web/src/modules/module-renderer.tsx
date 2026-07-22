import type { TModule } from '@blog/service';
import { Fragment, type ReactNode } from 'react';

import { MODULE_MAP } from './module-map';

export interface IModuleRendererProps {
  modules: TModule[];
  locale: string;
}

/**
 * ModuleRenderer — maps each thin `TModule` (from a page's `modules[]`)
 * to its registered per-module Server Component and renders it, keyed by
 * the module's `_id` (a page can't reference the same module twice — enforced
 * by a CMS uniqueness rule). Unknown module types render nothing and log a
 * warning rather than failing the whole page. `MODULE_MAP` deliberately
 * excludes `module_hero` from its key type (see `module-map.ts`), so the
 * lookup below casts to `keyof typeof MODULE_MAP` — if a `module_hero`
 * somehow reached here (schema-prevented in practice), it would still hit
 * the "unknown module type" fallback rather than type-error.
 */
export async function ModuleRenderer({
  modules,
  locale,
}: IModuleRendererProps): Promise<ReactNode> {
  const rendered = await Promise.all(
    modules.map(async (module) => {
      const Component = MODULE_MAP[module.type as keyof typeof MODULE_MAP];

      if (!Component) {
        console.warn(`ModuleRenderer: unknown module type "${module.type}"`);
        return null;
      }

      return {
        key: module.id,
        node: await Component({ id: module.id, locale }),
      };
    }),
  );

  return (
    <>
      {rendered.map((entry) =>
        entry ? <Fragment key={entry.key}>{entry.node}</Fragment> : null,
      )}
    </>
  );
}
